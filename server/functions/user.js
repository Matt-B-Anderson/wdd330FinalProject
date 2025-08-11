import { getUserIdFromEvent } from "./_auth.js";
import { q } from "./_db.js";

export async function handler(event) {
  const userId = getUserIdFromEvent(event);
  if (!userId) return { statusCode: 401, body: "Unauthorized" };
  const { rows } = await q(`SELECT id,email,created_at FROM users WHERE id=$1`, [userId]);
  return { statusCode: 200, body: JSON.stringify(rows[0]) };
}