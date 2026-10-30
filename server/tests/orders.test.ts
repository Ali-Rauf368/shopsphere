import { describe, expect, it } from "vitest";
import { ADMIN, api, bearer, login, productBySlug, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

const ADDRESS = "221B Baker Street, London NW1 6XE";

async function cartWith(token: string, items: [string, number][]) {
  for (const [slug, quantity] of items) {
    const p = await productBySlug(slug);
    await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id, quantity }).expect(201);
  }
}

describe("checkout", () => {
  it("creates a paid order, snapshots prices, decrements stock, and empties the cart", async () => {
    const token = await login();
    const before = await productBySlug("classic-oxford-shirt");
    await cartWith(token, [["classic-oxford-shirt", 2]]);
    const res = await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS }).expect(201);
    expect(res.body.order).toMatchObject({ status: "paid", totalCents: before.finalPriceCents * 2, shippingAddress: ADDRESS });
    expect(res.body.order.items).toEqual([expect.objectContaining({ quantity: 2, unitPriceCents: before.finalPriceCents })]);
    expect((await productBySlug("classic-oxford-shirt")).stock).toBe(before.stock - 2);
    expect((await api().get("/api/cart").set(bearer(token))).body.itemCount).toBe(0);
  });

  it("keeps the order price when the product price later changes", async () => {
    const token = await login();
    const p = await productBySlug("classic-oxford-shirt");
    await cartWith(token, [["classic-oxford-shirt", 1]]);
    const order = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS }).expect(201)).body.order;
    await api().patch(`/api/products/${p.id}`).set(bearer(await login(ADMIN))).send({ priceCents: 1 }).expect(200);
    const again = await api().get(`/api/orders/${order.id}`).set(bearer(token)).expect(200);
    expect(again.body.order.items[0].unitPriceCents).toBe(p.finalPriceCents);
  });

  it("rejects checkout with an empty cart", async () => {
    const res = await api().post("/api/orders").set(bearer(await login())).send({ shippingAddress: ADDRESS }).expect(400);
    expect(res.body.error).toBe("Your cart is empty");
  });

  it("rejects a too-short address", async () => {
    await api().post("/api/orders").set(bearer(await login())).send({ shippingAddress: "x" }).expect(400);
  });

  it("rejects checkout if stock dropped below the cart quantity", async () => {
    const token = await login();
    const p = await productBySlug("classic-oxford-shirt");
    await cartWith(token, [["classic-oxford-shirt", 5]]);
    await api().patch(`/api/products/${p.id}`).set(bearer(await login(ADMIN))).send({ stock: 2 }).expect(200);
    const res = await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS }).expect(409);
    expect(res.body.details).toEqual([expect.objectContaining({ productId: p.id, available: 2 })]);
    expect((await productBySlug("classic-oxford-shirt")).stock).toBe(2);
  });

  it("does not oversell when two customers race for the last units", async () => {
    const admin = await login(ADMIN);
    const p = await productBySlug("classic-oxford-shirt");
    const a = await login();
    const b = (await api().post("/api/auth/signup").send({ name: "Racer", email: "racer@x.io", password: "password1" })).body.token;
    await cartWith(a, [["classic-oxford-shirt", 2]]);
    await cartWith(b, [["classic-oxford-shirt", 2]]);
    await api().patch(`/api/products/${p.id}`).set(bearer(admin)).send({ stock: 3 }).expect(200);
    const results = await Promise.all([a, b].map((t) => api().post("/api/orders").set(bearer(t)).send({ shippingAddress: ADDRESS })));
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect((await productBySlug("classic-oxford-shirt")).stock).toBe(1);
  });
});

describe("order history", () => {
  it("lists only my orders, newest first", async () => {
    const token = await login();
    await cartWith(token, [["dinosaur-atlas", 1]]);
    const first = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    await cartWith(token, [["midnight-in-lisbon", 1]]);
    const second = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    const res = await api().get("/api/orders").set(bearer(token)).expect(200);
    expect(res.body.orders.map((o: { id: number }) => o.id)).toEqual([second.id, first.id]);
  });

  it("hides other users' orders", async () => {
    const token = await login();
    await cartWith(token, [["dinosaur-atlas", 1]]);
    const order = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    const other = (await api().post("/api/auth/signup").send({ name: "Snoop", email: "snoop@x.io", password: "password1" })).body.token;
    await api().get(`/api/orders/${order.id}`).set(bearer(other)).expect(404);
    expect((await api().get("/api/orders").set(bearer(other))).body.orders).toEqual([]);
  });

  it("lets an admin view any order", async () => {
    const token = await login();
    await cartWith(token, [["dinosaur-atlas", 1]]);
    const order = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    await api().get(`/api/orders/${order.id}`).set(bearer(await login(ADMIN))).expect(200);
  });

  it("400s on a non-numeric order id", async () => {
    await api().get("/api/orders/abc").set(bearer(await login())).expect(400);
  });
});

describe("cancellation", () => {
  it("cancels a paid order and restocks", async () => {
    const token = await login();
    const before = await productBySlug("dinosaur-atlas");
    await cartWith(token, [["dinosaur-atlas", 2]]);
    const order = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    const res = await api().post(`/api/orders/${order.id}/cancel`).set(bearer(token)).expect(200);
    expect(res.body.order.status).toBe("cancelled");
    expect((await productBySlug("dinosaur-atlas")).stock).toBe(before.stock);
  });

  it("cannot cancel twice", async () => {
    const token = await login();
    await cartWith(token, [["dinosaur-atlas", 1]]);
    const order = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    await api().post(`/api/orders/${order.id}/cancel`).set(bearer(token)).expect(200);
    await api().post(`/api/orders/${order.id}/cancel`).set(bearer(token)).expect(409);
  });

  it("cannot cancel a shipped order", async () => {
    const token = await login();
    await cartWith(token, [["dinosaur-atlas", 1]]);
    const order = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    await api().patch(`/api/admin/orders/${order.id}`).set(bearer(await login(ADMIN))).send({ status: "shipped" }).expect(200);
    await api().post(`/api/orders/${order.id}/cancel`).set(bearer(token)).expect(409);
  });

  it("cannot cancel someone else's order", async () => {
    const token = await login();
    await cartWith(token, [["dinosaur-atlas", 1]]);
    const order = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body.order;
    const other = (await api().post("/api/auth/signup").send({ name: "Snoop", email: "snoop@x.io", password: "password1" })).body.token;
    await api().post(`/api/orders/${order.id}/cancel`).set(bearer(other)).expect(404);
  });
});
