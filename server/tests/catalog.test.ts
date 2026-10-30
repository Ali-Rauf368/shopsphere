import { describe, expect, it } from "vitest";
import { api, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

describe("GET /api/categories", () => {
  it("returns 6 top-level categories with subcategories", async () => {
    const res = await api().get("/api/categories").expect(200);
    expect(res.body.categories).toHaveLength(6);
    expect(res.body.categories[0]).toMatchObject({ slug: "electronics", name: "Electronics" });
    expect(res.body.categories[0].children.map((c: { slug: string }) => c.slug)).toEqual([
      "electronics-phones", "electronics-laptops", "electronics-audio",
    ]);
  });

  it("returns one category by slug", async () => {
    const res = await api().get("/api/categories/fashion").expect(200);
    expect(res.body.category.children).toHaveLength(3);
  });

  it("404s for an unknown category", async () => {
    await api().get("/api/categories/nope").expect(404);
  });
});

describe("GET /api/products", () => {
  it("paginates with defaults", async () => {
    const res = await api().get("/api/products").expect(200);
    expect(res.body).toMatchObject({ page: 1, pageSize: 12, total: 49 });
    expect(res.body.products).toHaveLength(12);
  });

  it("returns the last partial page", async () => {
    const res = await api().get("/api/products?page=5&pageSize=12").expect(200);
    expect(res.body.products).toHaveLength(1);
  });

  it("filters by top-level category including subcategories", async () => {
    const res = await api().get("/api/products?category=electronics&pageSize=60").expect(200);
    expect(res.body.total).toBe(9);
    expect(new Set(res.body.products.map((p: { category: { slug: string } }) => p.category.slug))).toEqual(
      new Set(["electronics-phones", "electronics-laptops", "electronics-audio"]),
    );
  });

  it("filters by subcategory", async () => {
    const res = await api().get("/api/products?category=books-kids").expect(200);
    expect(res.body.total).toBe(2);
  });

  it("searches name and description case-insensitively", async () => {
    const res = await api().get("/api/products?q=SKILLET").expect(200);
    expect(res.body.products.map((p: { slug: string }) => p.slug)).toEqual(["cast-iron-skillet-28cm"]);
  });

  it("combines search with category", async () => {
    const res = await api().get("/api/products?q=audio&category=fashion").expect(200);
    expect(res.body.total).toBe(0);
  });

  it("returns only discounted products for offers=true", async () => {
    const res = await api().get("/api/products?offers=true&pageSize=60").expect(200);
    expect(res.body.total).toBeGreaterThan(0);
    for (const p of res.body.products) expect(p.discountPercent).toBeGreaterThan(0);
  });

  it("returns only featured products for featured=true", async () => {
    const res = await api().get("/api/products?featured=true&pageSize=60").expect(200);
    expect(res.body.total).toBe(16);
    for (const p of res.body.products) expect(p.featured).toBe(true);
  });

  it.each(["price_asc", "price_desc"] as const)("sorts by final price (%s)", async (sort) => {
    const res = await api().get(`/api/products?sort=${sort}&pageSize=60`).expect(200);
    const prices = res.body.products.map((p: { finalPriceCents: number }) => p.finalPriceCents);
    const sorted = [...prices].sort((a, b) => (sort === "price_asc" ? a - b : b - a));
    expect(prices).toEqual(sorted);
  });

  it("sorts by name", async () => {
    const res = await api().get("/api/products?sort=name&pageSize=60").expect(200);
    const names = res.body.products.map((p: { name: string }) => p.name.toLowerCase());
    expect(names).toEqual([...names].sort());
  });

  it("filters by price range in cents", async () => {
    const res = await api().get("/api/products?minPrice=10000&maxPrice=20000&pageSize=60").expect(200);
    expect(res.body.total).toBeGreaterThan(0);
    for (const p of res.body.products) {
      expect(p.finalPriceCents).toBeGreaterThanOrEqual(10000);
      expect(p.finalPriceCents).toBeLessThanOrEqual(20000);
    }
  });

  it.each(["sort=random", "page=0", "pageSize=500", "minPrice=-1", "featured=yes"])("rejects invalid query %s", async (qs) => {
    await api().get(`/api/products?${qs}`).expect(400);
  });

  it("treats SQL in the search term as plain text", async () => {
    const res = await api().get(`/api/products?q=${encodeURIComponent("'; DROP TABLE products; --")}`).expect(200);
    expect(res.body.total).toBe(0);
    await api().get("/api/products").expect(200);
  });
});

describe("GET /api/products/:slug", () => {
  it("returns product details with computed final price", async () => {
    const res = await api().get("/api/products/echo-pro-wireless-earbuds").expect(200);
    const p = res.body.product;
    expect(p).toMatchObject({ name: "Echo Pro Wireless Earbuds", priceCents: 14900, category: { slug: "electronics-audio" } });
    expect(p.finalPriceCents).toBe(Math.round((p.priceCents * (100 - p.discountPercent)) / 100));
  });

  it("includes rating aggregates", async () => {
    const res = await api().get("/api/products/echo-pro-wireless-earbuds").expect(200);
    expect(res.body.product.reviewCount).toBe(1);
    expect(res.body.product.rating).toBe(5);
  });

  it("404s for unknown slugs", async () => {
    await api().get("/api/products/does-not-exist").expect(404);
  });
});
