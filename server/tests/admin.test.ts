import { describe, expect, it } from "vitest";
import { ADMIN, api, bearer, login, useFreshDatabase } from "./helpers.js";

useFreshDatabase({ orders: true });

const newProduct = {
  slug: "test-gadget",
  name: "Test Gadget",
  priceCents: 1999,
  imageUrl: "https://picsum.photos/seed/test/600/450",
  categoryId: 2,
  stock: 5,
};

describe("admin access control", () => {
  it.each(["/api/admin/stats", "/api/admin/orders"])("forbids customers from %s", async (path) => {
    await api().get(path).set(bearer(await login())).expect(403);
  });

  it("forbids anonymous product creation", async () => {
    await api().post("/api/products").send(newProduct).expect(401);
  });

  it("forbids customers from creating products", async () => {
    await api().post("/api/products").set(bearer(await login())).send(newProduct).expect(403);
  });
});

describe("product management", () => {
  it("creates, updates and deletes a product", async () => {
    const token = await login(ADMIN);
    const created = await api().post("/api/products").set(bearer(token)).send(newProduct).expect(201);
    expect(created.body.product).toMatchObject({ slug: "test-gadget", finalPriceCents: 1999, category: { slug: "electronics-phones" } });

    const id = created.body.product.id;
    const updated = await api().patch(`/api/products/${id}`).set(bearer(token)).send({ discountPercent: 50, featured: true }).expect(200);
    expect(updated.body.product).toMatchObject({ finalPriceCents: 1000, featured: true });

    await api().delete(`/api/products/${id}`).set(bearer(token)).expect(204);
    await api().get("/api/products/test-gadget").expect(404);
  });

  it.each([
    { ...newProduct, slug: "Bad Slug" },
    { ...newProduct, priceCents: -1 },
    { ...newProduct, discountPercent: 95 },
    { ...newProduct, imageUrl: "not a url" },
  ])("validates %j", async (body) => {
    await api().post("/api/products").set(bearer(await login(ADMIN))).send(body).expect(400);
  });

  it("404s when updating or deleting a missing product", async () => {
    const token = await login(ADMIN);
    await api().patch("/api/products/99999").set(bearer(token)).send({ name: "Ghost" }).expect(404);
    await api().delete("/api/products/99999").set(bearer(token)).expect(404);
  });
});

describe("dashboard", () => {
  it("returns totals, 30 days of daily data and revenue by category", async () => {
    const res = await api().get("/api/admin/stats").set(bearer(await login(ADMIN))).expect(200);
    expect(res.body.totals.orders).toBeGreaterThan(30);
    expect(res.body.totals.revenueCents).toBeGreaterThan(0);
    expect(res.body.totals.products).toBe(49);
    expect(res.body.daily).toHaveLength(30);
    const dailySum = res.body.daily.reduce((n: number, d: { revenueCents: number }) => n + d.revenueCents, 0);
    expect(dailySum).toBe(res.body.totals.revenueCents);
    expect(res.body.revenueByCategory.length).toBeGreaterThan(0);
  });

  it("excludes cancelled orders from revenue", async () => {
    const token = await login(ADMIN);
    const before = (await api().get("/api/admin/stats").set(bearer(token))).body.totals.revenueCents;
    const [order] = (await api().get("/api/admin/orders").set(bearer(token))).body.orders;
    await api().patch(`/api/admin/orders/${order.id}`).set(bearer(token)).send({ status: "cancelled" }).expect(200);
    const after = (await api().get("/api/admin/stats").set(bearer(token))).body.totals.revenueCents;
    expect(after).toBe(before - order.totalCents);
  });

  it("lists low-stock products", async () => {
    const res = await api().get("/api/admin/stats").set(bearer(await login(ADMIN))).expect(200);
    expect(res.body.lowStock.every((p: { stock: number }) => p.stock < 10)).toBe(true);
    expect(res.body.lowStock.length).toBeGreaterThan(0);
  });

  it("rejects an invalid order status", async () => {
    await api().patch("/api/admin/orders/1").set(bearer(await login(ADMIN))).send({ status: "lost" }).expect(400);
  });
});
