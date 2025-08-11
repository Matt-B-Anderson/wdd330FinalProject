import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { q } from "./_db.js";
import { findUserByEmail, setCookie } from "./_auth.js";

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin"
});
const json = (code, body, origin, extraHeaders = {}) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json", ...cors(origin), ...extraHeaders },
  body: typeof body === "string" ? body : JSON.stringify(body ?? {})
});

export async function handler(event) {
  const origin = event.headers.origin;
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(origin), body: "" };
  if (event.httpMethod !== "POST") return json(405, { message: "Method Not Allowed" }, origin);

  try {
    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) return json(400, { message: "email and password required" }, origin);

    const existing = await findUserByEmail(email);
    if (existing) return json(409, { message: "Email already registered" }, origin);

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await q(
      `INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id,email`,
      [email, hash]
    );
    const user = rows[0];

    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: "30d" });
    return json(200, { id: user.id, email: user.email }, origin, { "Set-Cookie": setCookie(token) });
  } catch (err) {
    return json(500, { message: err.message || String(err) }, origin);
  }
}
