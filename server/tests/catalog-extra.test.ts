import { describe, expect, it } from "vitest";
import { ADMIN, api, bearer, login, productBySlug, useFreshDatabase } from "./helpers.js";

useFreshDatabase({ orders: true });

type P = { slug: string; stock: number; rating: number | null; soldCount: number; category: { slug: string } };

describe("catalog extras", () => {
  it("every product has a description and highlights", async () => {
    const res = await api().get("/api/products?pageSize=60").expect(200);
    for (const p of res.body.products) {
      expect(p.description.length).toBeGreaterThan(40);
      expect(p.highlights.length).toBeGreaterThanOrEqual(3);
      expect(p.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
    }
  });

  it("filters to in-stock products", async () => {
    const admin = await login(ADMIN);
    const p = await productBySlug("dinosaur-atlas");
    await api().patch(`/api/products/${p.id}`).set(bearer(admin)).send({ stock: 0 }).expect(200);
    const res = await api().get("/api/products?inStock=true&pageSize=60").expect(200);
    expect(res.body.total).toBe(48);
    expect(res.body.products.every((x: P) => x.stock > 0)).toBe(true);
  });

  it("filters by minimum rating", async () => {
    const res = await api().get("/api/products?minRating=4.5&pageSize=60").expect(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.products.every((x: P) => (x.rating ?? 0) >= 4.5)).toBe(true);
  });

  it("sorts by popularity using units sold", async () => {
    const res = await api().get("/api/products?sort=popular&pageSize=60").expect(200);
    const sold = res.body.products.map((x: P) => x.soldCount);
    expect(sold).toEqual([...sold].sort((a: number, b: number) => b - a));
    expect(sold[0]).toBeGreaterThan(0);
  });

  it("sorts by rating with unrated products last", async () => {
    const res = await api().get("/api/products?sort=rating&pageSize=60").expect(200);
    const ratings = res.body.products.map((x: P) => x.rating);
    const firstNull = ratings.indexOf(null);
    expect(ratings.slice(firstNull).every((r: number | null) => r === null)).toBe(true);
    const rated = ratings.slice(0, firstNull);
    expect(rated).toEqual([...rated].sort((a: number, b: number) => b - a));
  });

  it("returns related products from the same department, excluding itself", async () => {
    const res = await api().get("/api/products/aurora-x5-smartphone/related").expect(200);
    expect(res.body.products).toHaveLength(4);
    expect(res.body.products[0].category.slug).toBe("electronics-phones");
    expect(res.body.products.every((x: P) => x.slug !== "aurora-x5-smartphone" && x.category.slug.startsWith("electronics"))).toBe(true);
  });

  it("404s related for an unknown product", async () => {
    await api().get("/api/products/nope/related").expect(404);
  });
});

describe("admin product edits", () => {
  it("PATCH only changes the fields sent", async () => {
    const admin = await login(ADMIN);
    const before = (await api().get("/api/products?offers=true").expect(200)).body.products[0];
    const res = await api().patch(`/api/products/${before.id}`).set(bearer(admin)).send({ priceCents: 12345 }).expect(200);
    expect(res.body.product).toMatchObject({
      priceCents: 12345,
      discountPercent: before.discountPercent,
      featured: before.featured,
      highlights: before.highlights,
      stock: before.stock,
    });
  });

  it("returns 409 for a duplicate slug", async () => {
    const admin = await login(ADMIN);
    const res = await api()
      .post("/api/products")
      .set(bearer(admin))
      .send({ slug: "dinosaur-atlas", name: "Copy", priceCents: 100, imageUrl: "https://example.com/x.jpg", categoryId: 2 })
      .expect(409);
    expect(res.body.error).toMatch(/already exists/);
  });

  it("returns 400 for an unknown category", async () => {
    const admin = await login(ADMIN);
    await api()
      .post("/api/products")
      .set(bearer(admin))
      .send({ slug: "orphan", name: "Orphan", priceCents: 100, imageUrl: "https://example.com/x.jpg", categoryId: 9999 })
      .expect(400);
  });

  it("stores highlights on create", async () => {
    const admin = await login(ADMIN);
    const res = await api()
      .post("/api/products")
      .set(bearer(admin))
      .send({ slug: "lit", name: "Lit Lamp", priceCents: 100, imageUrl: "https://example.com/x.jpg", categoryId: 2, highlights: ["Bright", "Cheap"] })
      .expect(201);
    expect(res.body.product.highlights).toEqual(["Bright", "Cheap"]);
  });
});
