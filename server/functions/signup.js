import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { q } from "./_db.js";
import { setCookie, findUserByEmail } from "./_auth.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const { email, password } = JSON.parse(event.body || "{}");
  if (!email || !password) return { statusCode: 400, body: JSON.stringify({message:"email and password required"}) };

  const existing = await findUserByEmail(email);
  if (existing) return { statusCode: 409, body: JSON.stringify({message:"Email already registered"}) };

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await q(`INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id,email`, [email, hash]);
  const user = rows[0];

  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: "30d" });
  return {
    statusCode: 200,
    headers: { "Set-Cookie": setCookie(token), "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, email: user.email })
  };
}