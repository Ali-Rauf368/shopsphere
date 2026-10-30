import { config } from "./config.js";
import { runMigrations } from "./lib/migrations.js";

const ran = await runMigrations(config.databaseUrl);
console.log(ran.length ? `${ran.length} migration(s) applied` : "database is up to date");
