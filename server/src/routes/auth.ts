import bcrypt from "bcrypt";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { query } from "../db.js";
import { HttpError } from "../lib/http-error.js";
import { currentUser, requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => config.authRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(128),
});
const loginSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(1),
});

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: "customer" | "admin";
  password_hash: string;
  created_at: Date;
}

const publicUser = (u: UserRow) => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.created_at });

router.post("/signup", authLimiter, async (req, res) => {
  const body = signupSchema.parse(req.body);
  const hash = await bcrypt.hash(body.password, config.bcryptRounds);
  const rows = await query<UserRow>(
    `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING RETURNING *`,
    [body.email, body.name, hash],
  );
  const user = rows[0];
  if (!user) throw new HttpError(409, "An account with this email already exists");
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", authLimiter, async (req, res) => {
  const body = loginSchema.parse(req.body);
  const [user] = await query<UserRow>("SELECT * FROM users WHERE email = $1", [body.email]);
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [currentUser(req).id]);
  if (!user) throw new HttpError(401, "User no longer exists");
  res.json({ user: publicUser(user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  const { name } = z.object({ name: z.string().trim().min(2).max(80) }).parse(req.body);
  const [user] = await query<UserRow>("UPDATE users SET name = $2 WHERE id = $1 RETURNING *", [currentUser(req).id, name]);
  if (!user) throw new HttpError(401, "User no longer exists");
  res.json({ user: publicUser(user) });
});

router.post("/password", requireAuth, async (req, res) => {
  const body = z
    .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) })
    .refine((b) => b.currentPassword !== b.newPassword, { message: "New password must differ from the current one", path: ["newPassword"] })
    .parse(req.body);
  const id = currentUser(req).id;
  const [user] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  if (!user || !(await bcrypt.compare(body.currentPassword, user.password_hash))) {
    throw new HttpError(400, "Current password is incorrect");
  }
  await query("UPDATE users SET password_hash = $2 WHERE id = $1", [id, await bcrypt.hash(body.newPassword, config.bcryptRounds)]);
  res.status(204).end();
});

export default router;
