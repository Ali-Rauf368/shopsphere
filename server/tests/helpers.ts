import request from "supertest";
import { afterAll, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { pool } from "../src/db.js";
import { seedDatabase } from "../src/lib/seed.js";

export const app = createApp();
export const api = () => request(app);

export const ADMIN = { email: "admin@shopsphere.dev", password: "admin12345" };
export const DEMO = { email: "demo@shopsphere.dev", password: "demo12345" };

/** Reseeds before every test so each one starts from the same catalog. */
export function useFreshDatabase(opts: { orders?: boolean } = {}) {
  beforeEach(async () => {
    await seedDatabase(process.env.DATABASE_URL!, { bcryptRounds: 4, ...opts });
  });
  afterAll(async () => {
    await pool.end();
  });
}

export async function login(creds = DEMO): Promise<string> {
  const res = await api().post("/api/auth/login").send(creds).expect(200);
  return res.body.token;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function productBySlug(slug: string) {
  const res = await api().get(`/api/products/${slug}`).expect(200);
  return res.body.product as { id: number; stock: number; finalPriceCents: number; priceCents: number; discountPercent: number };
}
