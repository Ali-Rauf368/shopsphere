import { describe, expect, it } from "vitest";
import { api, bearer, login, productBySlug, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

describe("cart", () => {
  it("requires authentication", async () => {
    await api().get("/api/cart").expect(401);
    await api().post("/api/cart/items").send({ productId: 1 }).expect(401);
  });

  it("starts empty", async () => {
    const res = await api().get("/api/cart").set(bearer(await login())).expect(200);
    expect(res.body).toEqual({ items: [], itemCount: 0, subtotalCents: 0 });
  });

  it("adds items and computes totals from final prices", async () => {
    const token = await login();
    const p = await productBySlug("classic-oxford-shirt");
    const res = await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id, quantity: 2 }).expect(201);
    expect(res.body.itemCount).toBe(2);
    expect(res.body.subtotalCents).toBe(p.finalPriceCents * 2);
    expect(res.body.items[0].lineTotalCents).toBe(p.finalPriceCents * 2);
  });

  it("accumulates quantity when adding the same product twice", async () => {
    const token = await login();
    const p = await productBySlug("classic-oxford-shirt");
    await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id }).expect(201);
    const res = await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id, quantity: 3 }).expect(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(4);
  });

  it("refuses to exceed stock", async () => {
    const token = await login();
    const p = await productBySlug("classic-oxford-shirt");
    await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id, quantity: p.stock + 1 }).expect(409);
  });

  it("refuses to exceed stock across repeated adds", async () => {
    const token = await login();
    const low = (await api().get("/api/products?pageSize=60").expect(200)).body.products.find((x: { stock: number }) => x.stock === 3);
    await api().post("/api/cart/items").set(bearer(token)).send({ productId: low.id, quantity: 3 }).expect(201);
    const res = await api().post("/api/cart/items").set(bearer(token)).send({ productId: low.id, quantity: 1 }).expect(409);
    expect(res.body.error).toBe("Only 3 in stock");
  });

  it("404s for an unknown product", async () => {
    await api().post("/api/cart/items").set(bearer(await login())).send({ productId: 99999 }).expect(404);
  });

  it.each([{ productId: "abc" }, { productId: 1, quantity: 0 }, { productId: 1, quantity: 100 }, {}])("validates body %j", async (body) => {
    await api().post("/api/cart/items").set(bearer(await login())).send(body).expect(400);
  });

  it("sets an exact quantity", async () => {
    const token = await login();
    const p = await productBySlug("dinosaur-atlas");
    await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id, quantity: 5 }).expect(201);
    const res = await api().put(`/api/cart/items/${p.id}`).set(bearer(token)).send({ quantity: 2 }).expect(200);
    expect(res.body.items[0].quantity).toBe(2);
  });

  it("404s when setting quantity on an item not in the cart", async () => {
    const p = await productBySlug("dinosaur-atlas");
    await api().put(`/api/cart/items/${p.id}`).set(bearer(await login())).send({ quantity: 2 }).expect(404);
  });

  it("removes an item", async () => {
    const token = await login();
    const p = await productBySlug("dinosaur-atlas");
    await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id }).expect(201);
    const res = await api().delete(`/api/cart/items/${p.id}`).set(bearer(token)).expect(200);
    expect(res.body.items).toEqual([]);
  });

  it("empties the cart", async () => {
    const token = await login();
    const p = await productBySlug("dinosaur-atlas");
    await api().post("/api/cart/items").set(bearer(token)).send({ productId: p.id }).expect(201);
    await api().delete("/api/cart").set(bearer(token)).expect(204);
    expect((await api().get("/api/cart").set(bearer(token))).body.itemCount).toBe(0);
  });

  it("keeps carts separate per user", async () => {
    const demo = await login();
    const signup = await api().post("/api/auth/signup").send({ name: "Other", email: "other@x.io", password: "password1" }).expect(201);
    const p = await productBySlug("dinosaur-atlas");
    await api().post("/api/cart/items").set(bearer(demo)).send({ productId: p.id }).expect(201);
    const other = await api().get("/api/cart").set(bearer(signup.body.token)).expect(200);
    expect(other.body.itemCount).toBe(0);
  });
});
