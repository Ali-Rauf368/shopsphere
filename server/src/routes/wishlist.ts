import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { notFound } from "../lib/http-error.js";
import { PRODUCT_SELECT, serializeProduct, type ProductRow } from "../lib/serialize.js";
import { currentUser, requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

async function loadWishlist(userId: number) {
  const rows = await query<ProductRow>(
    `SELECT sub.* FROM wishlist_items w JOIN (${PRODUCT_SELECT}) sub ON sub.id = w.product_id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC, sub.id`,
    [userId],
  );
  return { products: rows.map(serializeProduct) };
}

const productId = z.coerce.number().int().positive();

router.get("/", async (req, res) => {
  res.json(await loadWishlist(currentUser(req).id));
});

/** Idempotent: adding twice is fine. */
router.put("/:productId", async (req, res) => {
  const id = productId.parse(req.params.productId);
  const exists = await query("SELECT 1 FROM products WHERE id = $1", [id]);
  if (!exists.length) throw notFound("Product");
  const userId = currentUser(req).id;
  await query("INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, id]);
  res.json(await loadWishlist(userId));
});

router.delete("/:productId", async (req, res) => {
  const userId = currentUser(req).id;
  await query("DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2", [userId, productId.parse(req.params.productId)]);
  res.json(await loadWishlist(userId));
});

export default router;
