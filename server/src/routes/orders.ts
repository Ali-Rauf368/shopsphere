import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../db.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { findCoupon, quote } from "../lib/pricing.js";
import { finalPrice } from "../lib/serialize.js";
import { currentUser, requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

interface OrderRow {
  id: number;
  user_id: number;
  status: string;
  recipient_name: string | null;
  phone: string | null;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  coupon_code: string | null;
  shipping_address: string;
  created_at: Date;
}

export async function loadOrder(id: number) {
  const [order] = await query<OrderRow>("SELECT * FROM orders WHERE id = $1", [id]);
  if (!order) return null;
  const items = await query<{ product_id: number; name: string; slug: string; image_url: string; quantity: number; unit_price_cents: number }>(
    `SELECT oi.product_id, p.name, p.slug, p.image_url, oi.quantity, oi.unit_price_cents
     FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1 ORDER BY p.name`,
    [id],
  );
  const events = await query<{ status: string; created_at: Date }>(
    "SELECT status, created_at FROM order_events WHERE order_id = $1 ORDER BY created_at, id",
    [id],
  );
  return {
    id: order.id,
    userId: order.user_id,
    status: order.status,
    recipientName: order.recipient_name,
    phone: order.phone,
    subtotalCents: order.subtotal_cents,
    discountCents: order.discount_cents,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    couponCode: order.coupon_code,
    shippingAddress: order.shipping_address,
    createdAt: order.created_at,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.name,
      slug: i.slug,
      imageUrl: i.image_url,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents,
    })),
    events: events.map((e) => ({ status: e.status, at: e.created_at })),
  };
}

const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().regex(/^[+0-9 ()-]{6,20}$/, "Enter a valid phone number").optional(),
  shippingAddress: z.string().trim().min(10).max(500),
  couponCode: z.string().trim().max(40).optional(),
});

/** Checks out the current cart: locks stock, snapshots prices, applies coupon and shipping, empties the cart. */
router.post("/", async (req, res) => {
  const body = checkoutSchema.parse(req.body);
  const userId = currentUser(req).id;

  const orderId = await withTransaction(async (client) => {
    const { rows: cart } = await client.query<{
      product_id: number; quantity: number; name: string; stock: number; price_cents: number; discount_percent: number;
    }>(
      `SELECT ci.product_id, ci.quantity, p.name, p.stock, p.price_cents, p.discount_percent
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1 ORDER BY p.id FOR UPDATE OF p`,
      [userId],
    );
    if (!cart.length) throw new HttpError(400, "Your cart is empty");
    const short = cart.filter((i) => i.quantity > i.stock);
    if (short.length) {
      throw new HttpError(409, "Some items are out of stock", short.map((i) => ({ productId: i.product_id, name: i.name, available: i.stock })));
    }
    const lines = cart.map((i) => ({ ...i, unit: finalPrice(i.price_cents, i.discount_percent) }));
    const subtotal = lines.reduce((n, l) => n + l.unit * l.quantity, 0);
    const coupon = body.couponCode ? await findCoupon(client, body.couponCode, subtotal) : null;
    const q = quote(subtotal, coupon);

    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO orders (user_id, status, recipient_name, phone, shipping_address, subtotal_cents, discount_cents, shipping_cents, total_cents, coupon_code)
       VALUES ($1, 'paid', coalesce($2, (SELECT name FROM users WHERE id = $1)), $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [userId, body.recipientName ?? null, body.phone ?? null, body.shippingAddress, q.subtotalCents, q.discountCents, q.shippingCents, q.totalCents, coupon?.code ?? null],
    );
    const id = rows[0]!.id;
    for (const l of lines) {
      await client.query("INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES ($1,$2,$3,$4)", [
        id, l.product_id, l.quantity, l.unit,
      ]);
      await client.query("UPDATE products SET stock = stock - $2 WHERE id = $1", [l.product_id, l.quantity]);
    }
    await client.query("INSERT INTO order_events (order_id, status) VALUES ($1, 'paid')", [id]);
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
    return id;
  });

  res.status(201).json({ order: await loadOrder(orderId) });
});

router.get("/", async (req, res) => {
  const ids = await query<{ id: number }>("SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC, id DESC", [
    currentUser(req).id,
  ]);
  res.json({ orders: await Promise.all(ids.map((r) => loadOrder(r.id))) });
});

router.get("/:id", async (req, res) => {
  const user = currentUser(req);
  const order = await loadOrder(z.coerce.number().int().positive().parse(req.params.id));
  if (!order || (order.userId !== user.id && user.role !== "admin")) throw notFound("Order");
  res.json({ order });
});

router.post("/:id/cancel", async (req, res) => {
  const user = currentUser(req);
  const id = z.coerce.number().int().positive().parse(req.params.id);
  await withTransaction(async (client) => {
    const { rows } = await client.query<OrderRow>("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
    const order = rows[0];
    if (!order || order.user_id !== user.id) throw notFound("Order");
    if (!["pending", "paid"].includes(order.status)) throw new HttpError(409, `Cannot cancel a ${order.status} order`);
    await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [id]);
    await client.query("INSERT INTO order_events (order_id, status) VALUES ($1, 'cancelled')", [id]);
    await client.query(
      "UPDATE products p SET stock = p.stock + oi.quantity FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id",
      [id],
    );
  });
  res.json({ order: await loadOrder(id) });
});

export default router;
