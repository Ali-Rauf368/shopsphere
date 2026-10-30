import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../db.js";
import { notFound } from "../lib/http-error.js";
import { requireAdmin } from "../middleware/auth.js";
import { loadOrder, ORDER_STATUSES } from "./orders.js";

const router = Router();
router.use(requireAdmin);

/** Numbers for the admin dashboard charts. Cancelled orders are excluded from revenue. */
router.get("/stats", async (_req, res) => {
  const [totals] = await query<{ revenue: string; orders: string; customers: string; products: string }>(`
    SELECT
      (SELECT coalesce(sum(total_cents), 0) FROM orders WHERE status <> 'cancelled') AS revenue,
      (SELECT count(*) FROM orders) AS orders,
      (SELECT count(*) FROM users WHERE role = 'customer') AS customers,
      (SELECT count(*) FROM products) AS products`);
  const daily = await query<{ day: string; revenue: string; orders: string }>(`
    SELECT to_char(d, 'YYYY-MM-DD') AS day,
           coalesce(sum(o.total_cents) FILTER (WHERE o.status <> 'cancelled'), 0) AS revenue,
           count(o.id) AS orders
    FROM generate_series(current_date - 29, current_date, interval '1 day') d
    LEFT JOIN orders o ON o.created_at::date = d::date
    GROUP BY d ORDER BY d`);
  const byCategory = await query<{ category: string; revenue: string }>(`
    SELECT coalesce(parent.name, c.name) AS category, sum(oi.quantity * oi.unit_price_cents) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
    JOIN products p ON p.id = oi.product_id
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories parent ON parent.id = c.parent_id
    GROUP BY 1 ORDER BY 2 DESC`);
  const lowStock = await query<{ id: number; name: string; stock: number }>(
    "SELECT id, name, stock FROM products WHERE stock < 10 ORDER BY stock, name LIMIT 10",
  );
  res.json({
    totals: {
      revenueCents: Number(totals!.revenue),
      orders: Number(totals!.orders),
      customers: Number(totals!.customers),
      products: Number(totals!.products),
    },
    daily: daily.map((d) => ({ day: d.day, revenueCents: Number(d.revenue), orders: Number(d.orders) })),
    revenueByCategory: byCategory.map((c) => ({ category: c.category, revenueCents: Number(c.revenue) })),
    lowStock,
  });
});

router.get("/orders", async (_req, res) => {
  const ids = await query<{ id: number }>("SELECT id FROM orders ORDER BY created_at DESC, id DESC LIMIT 100");
  res.json({ orders: await Promise.all(ids.map((r) => loadOrder(r.id))) });
});

router.patch("/orders/:id", async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { status } = z.object({ status: z.enum(ORDER_STATUSES) }).parse(req.body);
  await withTransaction(async (client) => {
    const { rows } = await client.query<{ status: string }>("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (!rows[0]) throw notFound("Order");
    if (rows[0].status === status) return;
    await client.query("UPDATE orders SET status = $2 WHERE id = $1", [id, status]);
    await client.query("INSERT INTO order_events (order_id, status) VALUES ($1, $2)", [id, status]);
  });
  res.json({ order: await loadOrder(id) });
});

export default router;
