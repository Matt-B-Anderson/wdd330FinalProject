import pg from "pg";
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL not set");
}

const sslRequired =
  /\bsslmode=require\b/i.test(connectionString) ||
  process.env.DATABASE_SSL === "true";

const pool = new Pool({
  connectionString,
  max: 5,                     
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  ssl: sslRequired ? { rejectUnauthorized: false } : false
});

export const q = (text, params) => pool.query(text, params);