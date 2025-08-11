import jwt from "jsonwebtoken";
import { q } from "./_db.js";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30;

export function setCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax;${secure}`;
}
export function clearCookie() {
  return `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;`;
}
function parseCookies(h = "") {
  return Object.fromEntries(
    h.split(/;\s*/).map(p => p.split("=")).map(([k, ...v]) => [k, v.join("=")])
  );
}
export function getUserIdFromEvent(event) {
  try {
    const cookies = parseCookies(event.headers.cookie || "");
    const raw = cookies[COOKIE];
    if (!raw) return null;
    const payload = jwt.verify(raw, process.env.JWT_SECRET);
    return payload.sub;
  } catch { return null; }
}

export async function findUserByEmail(email) {
  const { rows } = await q(`SELECT id, email, password_hash FROM users WHERE email=$1`, [email]);
  return rows[0] || null;
}