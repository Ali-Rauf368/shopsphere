import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { runMigrations } from "../src/lib/migrations.js";

const PGBIN = process.env.PGBIN ?? "/usr/lib/postgresql/16/bin";

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

/** Boots a disposable, migrated PostgreSQL 16 cluster in a temp dir. Call stop() to destroy it. */
export async function startPgSandbox() {
  const dir = mkdtempSync(path.join(tmpdir(), "shopsphere-pg-"));
  const data = path.join(dir, "data");
  const port = await freePort();
  execFileSync(`${PGBIN}/initdb`, ["-D", data, "-U", "test", "--auth=trust", "--no-sync"], { stdio: "ignore" });
  execFileSync(
    `${PGBIN}/pg_ctl`,
    ["-D", data, "-o", `-p ${port} -k ${dir} -c listen_addresses=localhost -c fsync=off`, "-l", path.join(dir, "log"), "-w", "start"],
    { stdio: "ignore" },
  );
  execFileSync(`${PGBIN}/createdb`, ["-h", "localhost", "-p", String(port), "-U", "test", "shop_test"]);
  const databaseUrl = `postgres://test@localhost:${port}/shop_test`;
  await runMigrations(databaseUrl, () => {});

  // Watchdog: if this process dies without running stop() (e.g. SIGKILL), shut the cluster down and delete it.
  spawn(
    "sh",
    ["-c", `while kill -0 ${process.pid} 2>/dev/null; do sleep 1; done; "${PGBIN}/pg_ctl" -D "${data}" -m immediate stop; rm -rf "${dir}"`],
    { detached: true, stdio: "ignore" },
  ).unref();

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    execFileSync(`${PGBIN}/pg_ctl`, ["-D", data, "-m", "immediate", "-w", "stop"], { stdio: "ignore" });
    rmSync(dir, { recursive: true, force: true });
  };
  return { databaseUrl, stop };
}
