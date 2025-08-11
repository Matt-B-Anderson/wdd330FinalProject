import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmail, setCookie } from "./_auth.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const { email, password } = JSON.parse(event.body || "{}");
  if (!email || !password) return { statusCode: 400, body: JSON.stringify({message:"email and password required"}) };

  const user = await findUserByEmail(email);
  if (!user) return { statusCode: 401, body: JSON.stringify({message:"Invalid credentials"}) };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return { statusCode: 401, body: JSON.stringify({message:"Invalid credentials"}) };

  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: "30d" });
  return {
    statusCode: 200,
    headers: { "Set-Cookie": setCookie(token), "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, email: user.email })
  };
}