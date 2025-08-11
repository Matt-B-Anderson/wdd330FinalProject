import { getUserIdFromEvent } from "./_auth.js";
import { q } from "./_db.js";

export async function handler(event) {
  const userId = getUserIdFromEvent(event);
  if (!userId) return { statusCode: 401, body: "Unauthorized" };

  if (event.httpMethod === "GET") {
    const { rows } = await q(`
      SELECT w.tmdb_id, w.added_at, m.title, m.poster_path
      FROM user_watched_movies w
      LEFT JOIN movies m USING (tmdb_id)
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `, [userId]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: rows }) // [] when none
    };
  }

  if (event.httpMethod === "POST") { /* ... */ }
  if (event.httpMethod === "DELETE") { /* ... */ }

  return { statusCode: 405, headers: { Allow: "GET, POST, DELETE" }, body: "Method Not Allowed" };
}