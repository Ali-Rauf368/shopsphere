import { describe, expect, it } from "vitest";
import { api, bearer, login, productBySlug, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

const ADDRESS = "1 Infinite Loop, Cupertino 95014";

async function add(token: string, slug: string, quantity = 1) {
  const p = await productBySlug(slug);
  await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id, quantity }).expect(201);
  return p;
}

describe("GET /api/cart/quote", () => {
  it("charges shipping below the free-shipping threshold", async () => {
    const token = await login();
    const p = await add(token, "dinosaur-atlas");
    const q = (await api().get("/api/cart/quote").set(bearer(token)).expect(200)).body;
    expect(q).toMatchObject({ subtotalCents: p.finalPriceCents, discountCents: 0, shippingCents: 499, totalCents: p.finalPriceCents + 499, coupon: null });
  });

  it("ships free at or above the threshold", async () => {
    const token = await login();
    await add(token, "classic-oxford-shirt", 2);
    expect((await api().get("/api/cart/quote").set(bearer(token))).body.shippingCents).toBe(0);
  });

  it("has zero shipping for an empty cart", async () => {
    const q = (await api().get("/api/cart/quote").set(bearer(await login()))).body;
    expect(q).toMatchObject({ subtotalCents: 0, shippingCents: 0, totalCents: 0 });
  });

  it("applies a coupon case-insensitively", async () => {
    const token = await login();
    await add(token, "classic-oxford-shirt", 2);
    const q = (await api().get("/api/cart/quote?coupon=welcome10").set(bearer(token)).expect(200)).body;
    expect(q.coupon).toMatchObject({ code: "WELCOME10", percentOff: 10 });
    expect(q.discountCents).toBe(Math.round(q.subtotalCents * 0.1));
    expect(q.totalCents).toBe(q.subtotalCents - q.discountCents + q.shippingCents);
  });

  it("adds shipping back when a coupon drops the total under the threshold", async () => {
    const token = await login();
    await add(token, "argan-repair-shampoo", 3); // 3 × $18 = $54
    const q = (await api().get("/api/cart/quote?coupon=WELCOME10").set(bearer(token))).body;
    expect(q.shippingCents).toBe(499);
  });

  it.each([
    ["NOPE", "is not valid"],
    ["SUMMER24", "is not valid"],
    ["PAUSED", "is not valid"],
    ["BIG20", "needs a subtotal of at least $150.00"],
  ])("rejects coupon %s", async (code, reason) => {
    const token = await login();
    await add(token, "dinosaur-atlas");
    const res = await api().get(`/api/cart/quote?coupon=${code}`).set(bearer(token)).expect(400);
    expect(res.body.error).toContain(reason);
  });
});

describe("checkout pricing", () => {
  it("stores subtotal, discount, shipping and coupon on the order", async () => {
    const token = await login();
    await add(token, "stratus-14-ultrabook");
    const quote = (await api().get("/api/cart/quote?coupon=BIG20").set(bearer(token))).body;
    const { order } = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS, couponCode: "big20" }).expect(201)).body;
    expect(order).toMatchObject({
      subtotalCents: quote.subtotalCents,
      discountCents: quote.discountCents,
      shippingCents: 0,
      totalCents: quote.totalCents,
      couponCode: "BIG20",
    });
  });

  it("charges shipping on small orders", async () => {
    const token = await login();
    const p = await add(token, "dinosaur-atlas");
    const { order } = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS }).expect(201)).body;
    expect(order).toMatchObject({ shippingCents: 499, totalCents: p.finalPriceCents + 499 });
  });

  it("rejects an invalid coupon without creating an order or touching the cart", async () => {
    const token = await login();
    await add(token, "dinosaur-atlas");
    await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS, couponCode: "NOPE" }).expect(400);
    expect((await api().get("/api/orders").set(bearer(token))).body.orders).toEqual([]);
    expect((await api().get("/api/cart").set(bearer(token))).body.itemCount).toBe(1);
  });

  it("defaults the recipient to the account name and stores phone", async () => {
    const token = await login();
    await add(token, "dinosaur-atlas");
    const { order } = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS, phone: "+49 30 1234567" }).expect(201)).body;
    expect(order).toMatchObject({ recipientName: "Demo Customer", phone: "+49 30 1234567" });
  });

  it("rejects an invalid phone number", async () => {
    const token = await login();
    await add(token, "dinosaur-atlas");
    await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS, phone: "call me" }).expect(400);
  });
});

describe("order timeline", () => {
  it("records each status change once", async () => {
    const token = await login();
    await add(token, "dinosaur-atlas");
    const { order } = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body;
    expect(order.events.map((e: { status: string }) => e.status)).toEqual(["paid"]);

    const admin = await login({ email: "admin@shopsphere.dev", password: "admin12345" });
    await api().patch(`/api/admin/orders/${order.id}`).set(bearer(admin)).send({ status: "shipped" }).expect(200);
    await api().patch(`/api/admin/orders/${order.id}`).set(bearer(admin)).send({ status: "shipped" }).expect(200);
    const res = await api().patch(`/api/admin/orders/${order.id}`).set(bearer(admin)).send({ status: "delivered" }).expect(200);
    expect(res.body.order.events.map((e: { status: string }) => e.status)).toEqual(["paid", "shipped", "delivered"]);
  });

  it("records cancellation", async () => {
    const token = await login();
    await add(token, "dinosaur-atlas");
    const { order } = (await api().post("/api/orders").set(bearer(token)).send({ shippingAddress: ADDRESS })).body;
    const res = await api().post(`/api/orders/${order.id}/cancel`).set(bearer(token)).expect(200);
    expect(res.body.order.events.map((e: { status: string }) => e.status)).toEqual(["paid", "cancelled"]);
  });
});
