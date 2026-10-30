import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { query } from "../db.js";
import { HttpError } from "../lib/http-error.js";
import { currentUser, requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

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

router.post("/signup", async (req, res) => {
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

router.post("/login", async (req, res) => {
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

export default router;
