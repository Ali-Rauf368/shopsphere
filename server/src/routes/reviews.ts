import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { notFound } from "../lib/http-error.js";
import { currentUser, requireAuth } from "../middleware/auth.js";

const router = Router();

interface ReviewRow {
  id: number;
  author_name: string;
  rating: number;
  comment: string;
  product_id: number | null;
  product_name: string | null;
  created_at: Date;
}

const serialize = (r: ReviewRow) => ({
  id: r.id,
  authorName: r.author_name,
  rating: r.rating,
  comment: r.comment,
  productId: r.product_id,
  productName: r.product_name,
  avatarUrl: `https://robohash.org/${encodeURIComponent(r.author_name)}?size=80x80`,
  createdAt: r.created_at,
});

const SELECT = `SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id`;

/** Store-wide reviews (About → Customer reviews), or reviews for one product with ?productId=. */
router.get("/", async (req, res) => {
  const { productId, limit } = z
    .object({ productId: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().min(1).max(100).default(20) })
    .parse(req.query);
  const rows = productId
    ? await query<ReviewRow>(`${SELECT} WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT $2`, [productId, limit])
    : await query<ReviewRow>(`${SELECT} ORDER BY r.created_at DESC LIMIT $1`, [limit]);
  res.json({ reviews: rows.map(serialize) });
});

router.post("/", requireAuth, async (req, res) => {
  const body = z
    .object({
      productId: z.number().int().positive().nullable().default(null),
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().min(3).max(2000),
    })
    .parse(req.body);
  if (body.productId) {
    const exists = await query("SELECT 1 FROM products WHERE id = $1", [body.productId]);
    if (!exists.length) throw notFound("Product");
  }
  const user = currentUser(req);
  const [inserted] = await query<{ id: number }>(
    `INSERT INTO reviews (user_id, product_id, author_name, rating, comment)
     VALUES ($1, $2, (SELECT name FROM users WHERE id = $1), $3, $4) RETURNING id`,
    [user.id, body.productId, body.rating, body.comment],
  );
  const [row] = await query<ReviewRow>(`${SELECT} WHERE r.id = $1`, [inserted!.id]);
  res.status(201).json({ review: serialize(row!) });
});

export default router;
