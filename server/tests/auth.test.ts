import { describe, expect, it } from "vitest";
import { ADMIN, api, bearer, DEMO, login, useFreshDatabase } from "./helpers.js";

useFreshDatabase();

describe("POST /api/auth/signup", () => {
  it("creates a customer and returns a token", async () => {
    const res = await api().post("/api/auth/signup").send({ name: "Ali", email: "Ali@Example.com", password: "supersecret" }).expect(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: "ali@example.com", name: "Ali", role: "customer" });
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  it("rejects a duplicate email regardless of case", async () => {
    const res = await api().post("/api/auth/signup").send({ name: "X", email: "DEMO@shopsphere.dev", password: "supersecret" });
    expect(res.status).toBe(400); // name too short is caught first
    const dup = await api().post("/api/auth/signup").send({ name: "Someone", email: "DEMO@shopsphere.dev", password: "supersecret" });
    expect(dup.status).toBe(409);
  });

  it.each([
    [{ name: "Ali", email: "not-an-email", password: "supersecret" }, "email"],
    [{ name: "Ali", email: "a@b.co", password: "short" }, "password"],
    [{ name: "A", email: "a@b.co", password: "supersecret" }, "name"],
    [{ email: "a@b.co", password: "supersecret" }, "name"],
  ])("validates input (%j)", async (body, field) => {
    const res = await api().post("/api/auth/signup").send(body).expect(400);
    expect(res.body.details.map((d: { path: string[] }) => d.path[0])).toContain(field);
  });

  it("returns 400 for malformed JSON", async () => {
    await api().post("/api/auth/signup").set("Content-Type", "application/json").send("{bad").expect(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const res = await api().post("/api/auth/login").send(DEMO).expect(200);
    expect(res.body.user.role).toBe("customer");
  });

  it("is case-insensitive on email", async () => {
    await api().post("/api/auth/login").send({ ...DEMO, email: DEMO.email.toUpperCase() }).expect(200);
  });

  it("rejects a wrong password", async () => {
    const res = await api().post("/api/auth/login").send({ ...DEMO, password: "wrongpass" }).expect(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("rejects an unknown email with the same message", async () => {
    const res = await api().post("/api/auth/login").send({ email: "nobody@x.io", password: "whatever1" }).expect(401);
    expect(res.body.error).toBe("Invalid email or password");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user", async () => {
    const res = await api().get("/api/auth/me").set(bearer(await login(ADMIN))).expect(200);
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: "admin" });
  });

  it.each([
    [{} as Record<string, string>, "no header"],
    [{ Authorization: "Bearer nonsense" }, "garbage token"],
    [{ Authorization: "Basic abc" }, "wrong scheme"],
  ])("rejects requests with %j (%s)", async (headers: Record<string, string>, _label: string) => {
    await api().get("/api/auth/me").set(headers).expect(401);
  });
});
