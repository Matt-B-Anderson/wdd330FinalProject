import { getUserIdFromEvent } from "./_auth.js";
import { q } from "./_db.js";

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  Vary: "Origin"
});
const json = (code, body, origin) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json", ...cors(origin) },
  body: typeof body === "string" ? body : JSON.stringify(body ?? {})
});

export async function handler(event) {
  const origin = event.headers.origin;
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(origin), body: "" };
  if (event.httpMethod !== "GET") return json(405, { message: "Method Not Allowed" }, origin);

  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) return json(401, { message: "Unauthorized" }, origin);

    const { rows } = await q(`SELECT id, email, created_at FROM users WHERE id=$1`, [userId]);
    if (!rows[0]) return json(404, { message: "User not found" }, origin);

    return json(200, rows[0], origin);
  } catch (err) {
    return json(500, { message: err.message || String(err) }, origin);
  }
}