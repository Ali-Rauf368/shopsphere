/**
 * API server for Playwright: disposable database, seeded demo data, torn down on exit.
 * Usage: tsx tests/e2e-server.ts (PORT defaults to 4100)
 */
import { startPgSandbox } from "./pg-sandbox.js";

const { databaseUrl, stop } = await startPgSandbox();
process.env.DATABASE_URL = databaseUrl;
process.env.JWT_SECRET ??= "e2e-secret";
process.env.BCRYPT_ROUNDS = "4";
process.env.AUTH_RATE_LIMIT ??= "100000";
process.env.PORT ??= "4100";
process.env.CLIENT_ORIGIN ??= "http://localhost:5181";

const { seedDatabase } = await import("../src/lib/seed.js");
await seedDatabase(databaseUrl, { bcryptRounds: 4, orders: true });
const { createApp } = await import("../src/app.js");
const server = createApp().listen(Number(process.env.PORT), () => console.log(`e2e API on :${process.env.PORT}`));

for (const sig of ["SIGINT", "SIGTERM", "exit"] as const) {
  process.on(sig, () => {
    server.close();
    stop();
    if (sig !== "exit") process.exit(0);
  });
}
