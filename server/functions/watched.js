import axios from "axios";
import { getUserIdFromEvent } from "./_auth.js";
import { q } from "./_db.js";

async function fetchTmdbMovie(tmdbId) {
  const V4 = process.env.TMDB_V4_TOKEN;
  const V3 = process.env.TMDB_V3_KEY;
  const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}`;
  const opts = V4 ? { headers: { Authorization: `Bearer ${V4}` } } : { params: { api_key: V3 } };
  const { data } = await axios.get(url, opts);
  return data;
}

export async function handler(event) {
  const origin = event.headers.origin || "";
  const cors = {
    "Access-Control-Allow-Origin": origin || "*",
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };
  const json = (statusCode, bodyObj) => ({
    statusCode,
    headers: { "Content-Type": "application/json", ...cors },
    body: typeof bodyObj === "string" ? bodyObj : JSON.stringify(bodyObj ?? {})
  });

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  const userId = getUserIdFromEvent(event);
  if (!userId) return json(401, "Unauthorized");

  if (event.httpMethod === "GET") {
    const { rows } = await q(`
      SELECT w.tmdb_id, w.added_at, m.title, m.poster_path
      FROM user_watched_movies w
      LEFT JOIN movies m USING (tmdb_id)
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `, [userId]);
    return json(200, { results: rows });
  }

  if (event.httpMethod === "POST") {
    const { tmdb_id } = JSON.parse(event.body || "{}");
    if (!tmdb_id) return json(400, { message: "tmdb_id required" });

    try {
      const m = await fetchTmdbMovie(tmdb_id);
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

      await q(`
        INSERT INTO user_watched_movies (user_id, tmdb_id)
        VALUES ($1,$2)
        ON CONFLICT DO NOTHING
      `, [userId, tmdb_id]);

      return json(200, { ok: true });
    } catch (err) {
      const status = err.response?.status || 500;
      const message = err.response?.data || err.message;
      return json(status, { message });
    }
  }

  if (event.httpMethod === "DELETE") {
    const { tmdb_id } = JSON.parse(event.body || "{}");
    if (!tmdb_id) return json(400, { message: "tmdb_id required" });
    await q(`DELETE FROM user_watched_movies WHERE user_id=$1 AND tmdb_id=$2`, [userId, tmdb_id]);
    return json(200, { ok: true });
  }

  return json(405, "Method Not Allowed");
}