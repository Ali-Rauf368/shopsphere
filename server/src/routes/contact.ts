import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  const body = z
    .object({ name: z.string().trim().min(2).max(100), email: z.email(), message: z.string().trim().min(10).max(5000) })
    .parse(req.body);
  const [row] = await query<{ id: number }>(
    "INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING id",
    [body.name, body.email, body.message],
  );
  res.status(201).json({ id: row!.id, message: "Thanks! We'll get back to you soon." });
});

export const newsletter = Router();

/** Idempotent: subscribing twice still succeeds. */
newsletter.post("/", async (req, res) => {
  const { email } = z.object({ email: z.email().transform((e) => e.toLowerCase()) }).parse(req.body);
  await query("INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING", [email]);
  res.status(201).json({ message: "You're subscribed! Watch your inbox for deals." });
});

export default router;
