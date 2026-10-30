import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.issues });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  // PostgreSQL constraint violations that a client can cause.
  if (err?.code === "23505") {
    res.status(409).json({ error: "A record with this value already exists", details: err.detail });
    return;
  }
  if (err?.code === "23503") {
    res.status(400).json({ error: "Referenced record does not exist", details: err.detail });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
