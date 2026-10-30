import { describe, expect, it } from "vitest";
import { config } from "../src/config.js";
import { api, bearer, DEMO, login, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

describe("profile", () => {
  it("updates the display name", async () => {
    const token = await login();
    const res = await api().patch("/api/auth/me").set(bearer(token)).send({ name: "  Ali Rauf  " }).expect(200);
    expect(res.body.user.name).toBe("Ali Rauf");
    expect((await api().get("/api/auth/me").set(bearer(token))).body.user.name).toBe("Ali Rauf");
  });

  it("validates the name", async () => {
    await api().patch("/api/auth/me").set(bearer(await login())).send({ name: "A" }).expect(400);
  });
});

describe("change password", () => {
  it("changes the password so only the new one works", async () => {
    const token = await login();
    await api().post("/api/auth/password").set(bearer(token)).send({ currentPassword: DEMO.password, newPassword: "brand-new-pass" }).expect(204);
    await api().post("/api/auth/login").send(DEMO).expect(401);
    await api().post("/api/auth/login").send({ email: DEMO.email, password: "brand-new-pass" }).expect(200);
  });

  it("rejects a wrong current password", async () => {
    const res = await api().post("/api/auth/password").set(bearer(await login())).send({ currentPassword: "nope", newPassword: "brand-new-pass" }).expect(400);
    expect(res.body.error).toBe("Current password is incorrect");
  });

  it.each([
    { currentPassword: DEMO.password, newPassword: "short" },
    { currentPassword: DEMO.password, newPassword: DEMO.password },
  ])("validates %j", async (body) => {
    await api().post("/api/auth/password").set(bearer(await login())).send(body).expect(400);
  });
});

describe("newsletter", () => {
  it("subscribes idempotently", async () => {
    await api().post("/api/newsletter").send({ email: "Fan@Example.com" }).expect(201);
    await api().post("/api/newsletter").send({ email: "fan@example.com" }).expect(201);
  });

  it("rejects a bad email", async () => {
    await api().post("/api/newsletter").send({ email: "nope" }).expect(400);
  });
});

describe("auth rate limiting", () => {
  it("returns 429 after too many attempts", async () => {
    const original = config.authRateLimit;
    config.authRateLimit = 3;
    try {
      const attempt = () => api().post("/api/auth/login").send({ email: "x@y.io", password: "wrongpass" });
      const statuses = [];
      for (let i = 0; i < 5; i++) statuses.push((await attempt()).status);
      expect(statuses.slice(-1)[0]).toBe(429);
    } finally {
      config.authRateLimit = original;
    }
  });
});
