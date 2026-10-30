import { describe, expect, it } from "vitest";
import { api, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

describe("system", () => {
  it("reports health", async () => {
    expect((await api().get("/api/health").expect(200)).body).toEqual({ status: "ok" });
  });

  it("serves an OpenAPI 3.1 document covering every route group", async () => {
    const res = await api().get("/api/openapi.json").expect(200);
    expect(res.body.openapi).toBe("3.1.0");
    for (const p of ["/api/auth/login", "/api/auth/password", "/api/products", "/api/cart", "/api/cart/quote", "/api/wishlist", "/api/orders", "/api/reviews", "/api/newsletter", "/api/admin/stats"]) {
      expect(res.body.paths).toHaveProperty([p]);
    }
  });

  it("serves Swagger UI", async () => {
    const res = await api().get("/api/docs/").expect(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("returns JSON 404 for unknown routes", async () => {
    const res = await api().get("/api/nope").expect(404);
    expect(res.body.error).toBe("Route not found");
  });

  it("sets security headers", async () => {
    const res = await api().get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
