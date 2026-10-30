import type { TestProject } from "vitest/node";
import { startPgSandbox } from "./pg-sandbox.js";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/** One disposable PostgreSQL cluster per test run, destroyed afterwards. */
export default async function setup(project: TestProject) {
  const { databaseUrl, stop } = await startPgSandbox();
  project.provide("databaseUrl", databaseUrl);
  return stop;
}
