import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5180",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  /** Login/signup attempts allowed per IP per 15 minutes. */
  /** Set when running behind a reverse proxy so rate limiting sees real client IPs (e.g. "1" or "loopback"). */
  trustProxy: process.env.TRUST_PROXY,
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 20),
};
