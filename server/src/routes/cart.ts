import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { PRODUCT_SELECT, serializeProduct, type ProductRow } from "../lib/serialize.js";
import { currentUser, requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

export async function loadCart(userId: number) {
  const rows = await query<ProductRow & { quantity: number }>(
    `SELECT sub.*, ci.quantity FROM cart_items ci
     JOIN (${PRODUCT_SELECT}) sub ON sub.id = ci.product_id
     WHERE ci.user_id = $1 ORDER BY sub.name`,
    [userId],
  );
  const items = rows.map((r) => {
    const product = serializeProduct(r);
    return { product, quantity: r.quantity, lineTotalCents: product.finalPriceCents * r.quantity };
  });
  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.lineTotalCents, 0),
  };
}

const itemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99).default(1),
});

router.get("/", async (req, res) => {
  res.json(await loadCart(currentUser(req).id));
});

/** Adds to the existing quantity. */
router.post("/items", async (req, res) => {
  const { productId, quantity } = itemSchema.parse(req.body);
  const [product] = await query<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [productId]);
  if (!product) throw notFound("Product");
  const userId = currentUser(req).id;
  const [existing] = await query<{ quantity: number }>(
    "SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2",
    [userId, productId],
  );
  const next = (existing?.quantity ?? 0) + quantity;
  if (next > product.stock) throw new HttpError(409, `Only ${product.stock} in stock`);
  await query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [userId, productId, next],
  );
  res.status(201).json(await loadCart(userId));
});

/** Sets the quantity exactly. */
router.put("/items/:productId", async (req, res) => {
  const productId = z.coerce.number().int().positive().parse(req.params.productId);
  const { quantity } = z.object({ quantity: z.number().int().min(1).max(99) }).parse(req.body);
  const userId = currentUser(req).id;
  const [product] = await query<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [productId]);
  if (!product) throw notFound("Product");
  if (quantity > product.stock) throw new HttpError(409, `Only ${product.stock} in stock`);
  const updated = await query(
    "UPDATE cart_items SET quantity = $3 WHERE user_id = $1 AND product_id = $2 RETURNING 1",
    [userId, productId, quantity],
  );
  if (!updated.length) throw notFound("Cart item");
  res.json(await loadCart(userId));
});

router.delete("/items/:productId", async (req, res) => {
  const productId = z.coerce.number().int().positive().parse(req.params.productId);
  const userId = currentUser(req).id;
  await query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [userId, productId]);
  res.json(await loadCart(userId));
});

router.delete("/", async (req, res) => {
  await query("DELETE FROM cart_items WHERE user_id = $1", [currentUser(req).id]);
  res.status(204).end();
});

export default router;
