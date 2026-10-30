import { inject } from "vitest";

process.env.DATABASE_URL = inject("databaseUrl");
process.env.JWT_SECRET = "test-secret";
process.env.BCRYPT_ROUNDS = "4";
