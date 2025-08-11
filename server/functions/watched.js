import axios from "axios";
import { q } from "./_db.js";
import { getUserIdFromEvent } from "./_auth.js";

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  Vary: "Origin"
});
const json = (code, body, origin) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json", ...cors(origin) },
  body: typeof body === "string" ? body : JSON.stringify(body ?? {})
});

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(event.headers.origin), body: "" };

    const userId = getUserIdFromEvent(event);
    if (!userId) return json(401, { message: "Unauthorized" }, event.headers.origin);

    if (event.httpMethod === "GET") {
      const { rows } = await q(`
        SELECT w.tmdb_id, w.added_at, m.title, m.poster_path
        FROM user_watched_movies w
        LEFT JOIN movies m USING (tmdb_id)
        WHERE w.user_id = $1
        ORDER BY w.added_at DESC
      `, [userId]);
      return json(200, { results: rows }, event.headers.origin);
    }

    if (event.httpMethod === "POST") {
      const { tmdb_id } = JSON.parse(event.body || "{}");
      if (!tmdb_id) return json(400, { message: "tmdb_id required" }, event.headers.origin);

      // keep external calls snappy + safe
      const V4 = process.env.TMDB_V4_TOKEN;
      const V3 = process.env.TMDB_V3_KEY;
      const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdb_id)}`;
      const opts = V4 ? { headers: { Authorization: `Bearer ${V4}` }, timeout: 8000 }
                      : { params: { api_key: V3 }, timeout: 8000 };

      const { data: m } = await axios.get(url, opts);

      await q(`
        INSERT INTO movies (tmdb_id, title, release_date, poster_path, imdb_id, metadata)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (tmdb_id) DO UPDATE
          SET title=EXCLUDED.title,
              release_date=EXCLUDED.release_date,
              poster_path=EXCLUDED.poster_path,
              imdb_id=EXCLUDED.imdb_id,
              metadata=EXCLUDED.metadata,
              updated_at=now()
      `, [m.id, m.title ?? null, m.release_date ?? null, m.poster_path ?? null, m.imdb_id ?? null, m]);

      await q(`INSERT INTO user_watched_movies (user_id, tmdb_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [userId, tmdb_id]);
      return json(200, { ok: true }, event.headers.origin);
    }

    if (event.httpMethod === "DELETE") {
      const { tmdb_id } = JSON.parse(event.body || "{}");
      if (!tmdb_id) return json(400, { message: "tmdb_id required" }, event.headers.origin);
      await q(`DELETE FROM user_watched_movies WHERE user_id=$1 AND tmdb_id=$2`, [userId, tmdb_id]);
      return json(200, { ok: true }, event.headers.origin);
    }

    return json(405, { message: "Method Not Allowed" }, event.headers.origin);
  } catch (err) {
    console.error("watched error:", err?.stack || err);           // <- shows up in logs
    return json(500, { message: err?.message || String(err) }, event.headers.origin);
  }
}