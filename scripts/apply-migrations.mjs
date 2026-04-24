#!/usr/bin/env node
// Apply every SQL file in supabase/migrations/ to the Supabase Postgres
// instance in lexical order. Requires SUPABASE_DB_URL in .env.local.
//
// Usage:
//   node scripts/apply-migrations.mjs
//
// Safe to re-run: migrations use IF NOT EXISTS / ON CONFLICT.

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function loadEnv() {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Set SUPABASE_DB_URL in .env.local (postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres)");
  process.exit(1);
}

const dir = path.resolve("supabase/migrations");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

(async () => {
  await client.connect();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    process.stdout.write(`applying ${file} ... `);
    try {
      await client.query(sql);
      console.log("ok");
    } catch (err) {
      console.error("FAILED");
      console.error(err.message);
      process.exit(1);
    }
  }
  await client.end();
  console.log("\nAll migrations applied.");
})();
