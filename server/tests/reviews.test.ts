import { describe, expect, it } from "vitest";
import { api, bearer, login, productBySlug, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

describe("reviews", () => {
  it("lists store reviews newest first with robohash avatars", async () => {
    const res = await api().get("/api/reviews").expect(200);
    expect(res.body.reviews).toHaveLength(7);
    expect(res.body.reviews[0].authorName).toBe("Ayesha Khan");
    expect(res.body.reviews[0].avatarUrl).toMatch(/^https:\/\/robohash\.org\//);
  });

  it("respects limit", async () => {
    expect((await api().get("/api/reviews?limit=3").expect(200)).body.reviews).toHaveLength(3);
  });

  it("filters by product", async () => {
    const p = await productBySlug("echo-pro-wireless-earbuds");
    const res = await api().get(`/api/reviews?productId=${p.id}`).expect(200);
    expect(res.body.reviews.every((r: { productId: number }) => r.productId === p.id)).toBe(true);
  });

  it("requires login to post", async () => {
    await api().post("/api/reviews").send({ rating: 5, comment: "Great" }).expect(401);
  });

  it("posts a review under the user's name and updates the product rating", async () => {
    const token = await login();
    const p = await productBySlug("echo-pro-wireless-earbuds");
    const res = await api().post("/api/reviews").set(bearer(token)).send({ productId: p.id, rating: 3, comment: "Decent earbuds" }).expect(201);
    expect(res.body.review).toMatchObject({ authorName: "Demo Customer", rating: 3, productName: "Echo Pro Wireless Earbuds" });
    const updated = (await api().get("/api/products/echo-pro-wireless-earbuds")).body.product;
    expect(updated).toMatchObject({ reviewCount: 2, rating: 4 });
  });

  it("allows a store-wide review without a product", async () => {
    const res = await api().post("/api/reviews").set(bearer(await login())).send({ rating: 5, comment: "Love this shop" }).expect(201);
    expect(res.body.review.productId).toBeNull();
  });

  it.each([{ rating: 0, comment: "ok ok" }, { rating: 6, comment: "ok ok" }, { rating: 4, comment: "" }, { rating: 4.5, comment: "fine" }])(
    "validates %j",
    async (body) => {
      await api().post("/api/reviews").set(bearer(await login())).send(body).expect(400);
    },
  );

  it("404s for an unknown product", async () => {
    await api().post("/api/reviews").set(bearer(await login())).send({ productId: 99999, rating: 4, comment: "Hmm" }).expect(404);
  });
});

describe("contact", () => {
  it("stores a message", async () => {
    const res = await api().post("/api/contact").send({ name: "Ali", email: "ali@x.io", message: "Do you ship to Pakistan?" }).expect(201);
    expect(res.body.id).toEqual(expect.any(Number));
  });

  it.each([{ name: "Ali", email: "bad", message: "long enough message" }, { name: "Ali", email: "a@x.io", message: "short" }])(
    "validates %j",
    async (body) => {
      await api().post("/api/contact").send(body).expect(400);
    },
  );
});
