import { describe, expect, it } from "vitest";
import { api, bearer, login, productBySlug, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

describe("wishlist", () => {
  it("requires authentication", async () => {
    await api().get("/api/wishlist").expect(401);
  });

  it("adds, lists newest first, and removes products", async () => {
    const token = await login();
    const a = await productBySlug("dinosaur-atlas");
    const b = await productBySlug("brass-table-lamp");
    await api().put(`/api/wishlist/${a.id}`).set(bearer(token)).expect(200);
    const res = await api().put(`/api/wishlist/${b.id}`).set(bearer(token)).expect(200);
    expect(res.body.products.map((p: { slug: string }) => p.slug)).toEqual(["brass-table-lamp", "dinosaur-atlas"]);
    const after = await api().delete(`/api/wishlist/${b.id}`).set(bearer(token)).expect(200);
    expect(after.body.products.map((p: { slug: string }) => p.slug)).toEqual(["dinosaur-atlas"]);
  });

  it("is idempotent", async () => {
    const token = await login();
    const a = await productBySlug("dinosaur-atlas");
    await api().put(`/api/wishlist/${a.id}`).set(bearer(token)).expect(200);
    const res = await api().put(`/api/wishlist/${a.id}`).set(bearer(token)).expect(200);
    expect(res.body.products).toHaveLength(1);
    await api().delete(`/api/wishlist/${a.id}`).set(bearer(token)).expect(200);
    await api().delete(`/api/wishlist/${a.id}`).set(bearer(token)).expect(200);
  });

  it("404s for unknown products and 400s for bad ids", async () => {
    const token = await login();
    await api().put("/api/wishlist/99999").set(bearer(token)).expect(404);
    await api().put("/api/wishlist/abc").set(bearer(token)).expect(400);
  });

  it("is private to each user", async () => {
    const token = await login();
    const a = await productBySlug("dinosaur-atlas");
    await api().put(`/api/wishlist/${a.id}`).set(bearer(token)).expect(200);
    const other = (await api().post("/api/auth/signup").send({ name: "Other", email: "o@x.io", password: "password1" })).body.token;
    expect((await api().get("/api/wishlist").set(bearer(other))).body.products).toEqual([]);
  });
});
