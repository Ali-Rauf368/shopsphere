import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { notFound } from "../lib/http-error.js";
import { PRODUCT_SELECT, serializeProduct, type ProductRow } from "../lib/serialize.js";
import { requireAdmin } from "../middleware/auth.js";

const idParam = z.coerce.number().int().positive();

const router = Router();

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
  offers: z.enum(["true", "false"]).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name", "popular", "rating"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});

const SORTS = {
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price_cents * (100 - p.discount_percent) ASC, p.id",
  price_desc: "p.price_cents * (100 - p.discount_percent) DESC, p.id",
  name: `lower(p.name) COLLATE "C" ASC, p.id`,
  popular: `(SELECT coalesce(sum(oi.quantity), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.status <> 'cancelled') DESC, p.id`,
  rating: "(SELECT avg(r.rating) FROM reviews r WHERE r.product_id = p.id) DESC NULLS LAST, p.id",
} as const;

router.get("/", async (req, res) => {
  const f = listSchema.parse(req.query);
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replaceAll("?", `$${params.length}`));
  };

  if (f.q) add("(p.name ILIKE ? OR p.description ILIKE ?)", `%${f.q}%`);
  if (f.category) {
    // Matches the category itself or any of its subcategories.
    add("(c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))", f.category);
  }
  if (f.featured) add("p.featured = ?", f.featured === "true");
  if (f.offers === "true") where.push("p.discount_percent > 0");
  if (f.inStock === "true") where.push("p.stock > 0");
  if (f.minRating !== undefined) add("(SELECT coalesce(avg(r.rating), 0) FROM reviews r WHERE r.product_id = p.id) >= ?", f.minRating);
  if (f.minPrice !== undefined) add("p.price_cents * (100 - p.discount_percent) / 100 >= ?", f.minPrice);
  if (f.maxPrice !== undefined) add("p.price_cents * (100 - p.discount_percent) / 100 <= ?", f.maxPrice);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [countRow] = await query<{ count: string }>(
    `SELECT count(*) FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`,
    params,
  );
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} ${whereSql} ORDER BY ${SORTS[f.sort]} LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}`,
    params,
  );
  res.json({ products: rows.map(serializeProduct), total: Number(countRow?.count ?? 0), page: f.page, pageSize: f.pageSize });
});

/** Same subcategory first, then the rest of the department; never the product itself. */
router.get("/:slug/related", async (req, res) => {
  const [base] = await query<{ id: number; category_id: number; parent_id: number | null }>(
    "SELECT p.id, p.category_id, c.parent_id FROM products p JOIN categories c ON c.id = p.category_id WHERE p.slug = $1",
    [req.params.slug],
  );
  if (!base) throw notFound("Product");
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.id <> $1 AND (p.category_id = $2 OR c.parent_id = $3)
     ORDER BY (p.category_id = $2) DESC, p.featured DESC, p.id LIMIT 4`,
    [base.id, base.category_id, base.parent_id],
  );
  res.json({ products: rows.map(serializeProduct) });
});

router.get("/:slug", async (req, res) => {
  const [row] = await query<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = $1`, [req.params.slug]);
  if (!row) throw notFound("Product");
  res.json({ product: serializeProduct(row) });
});

const productFields = {
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  name: z.string().trim().min(2).max(200),
  description: z.string().max(5000),
  priceCents: z.number().int().min(0),
  discountPercent: z.number().int().min(0).max(90),
  imageUrl: z.url(),
  videoUrl: z.url().nullable(),
  stock: z.number().int().min(0),
  featured: z.boolean(),
  highlights: z.array(z.string().trim().min(1).max(200)).max(8),
  categoryId: z.number().int().positive(),
};

const createSchema = z.object({
  ...productFields,
  description: productFields.description.default(""),
  discountPercent: productFields.discountPercent.default(0),
  videoUrl: productFields.videoUrl.optional(),
  stock: productFields.stock.default(0),
  featured: productFields.featured.default(false),
  highlights: productFields.highlights.default([]),
});

// No defaults here: a PATCH must only touch the fields it sends.
const patchSchema = z.object(productFields).partial();

router.post("/", requireAdmin, async (req, res) => {
  const p = createSchema.parse(req.body);
  const [created] = await query<{ slug: string }>(
    `INSERT INTO products (slug, name, description, price_cents, discount_percent, image_url, video_url, stock, featured, highlights, category_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING slug`,
    [p.slug, p.name, p.description, p.priceCents, p.discountPercent, p.imageUrl, p.videoUrl ?? null, p.stock, p.featured, p.highlights, p.categoryId],
  );
  const [row] = await query<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = $1`, [created!.slug]);
  res.status(201).json({ product: serializeProduct(row!) });
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const id = idParam.parse(req.params.id);
  const patch = patchSchema.parse(req.body);
  const columns: Record<string, string> = {
    slug: "slug", name: "name", description: "description", priceCents: "price_cents",
    discountPercent: "discount_percent", imageUrl: "image_url", videoUrl: "video_url",
    stock: "stock", featured: "featured", highlights: "highlights", categoryId: "category_id",
  };
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length) {
    const sets = entries.map(([k], i) => `${columns[k]} = $${i + 2}`).join(", ");
    const updated = await query(`UPDATE products SET ${sets} WHERE id = $1 RETURNING id`, [
      id,
      ...entries.map(([, v]) => v),
    ]);
    if (!updated.length) throw notFound("Product");
  }
  const [row] = await query<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
  if (!row) throw notFound("Product");
  res.json({ product: serializeProduct(row) });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const deleted = await query("DELETE FROM products WHERE id = $1 RETURNING id", [idParam.parse(req.params.id)]);
  if (!deleted.length) throw notFound("Product");
  res.status(204).end();
});

export default router;
