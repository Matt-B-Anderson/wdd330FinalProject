import axios from "axios";

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
    const tmdbId = event.queryStringParameters?.id;
    const imdbId = event.queryStringParameters?.imdb;

    const OMDB = process.env.OMDB_API_KEY;
    if (!OMDB) return json(500, { message: "OMDB_API_KEY not configured" }, origin);

    let imdb = imdbId || null;

    if (!imdb && tmdbId) {
      const V4 = process.env.TMDB_V4_TOKEN;
      const V3 = process.env.TMDB_V3_KEY;
      if (!V4 && !V3) return json(500, { message: "TMDB key/token required to resolve IMDb id" }, origin);

      const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}`;
      const opts = V4
        ? { headers: { Authorization: `Bearer ${V4}` }, params: { append_to_response: "external_ids" }, timeout: 8000 }
        : { params: { api_key: V3, append_to_response: "external_ids" }, timeout: 8000 };

      const { data: m } = await axios.get(url, opts);
      imdb = m.imdb_id || m.external_ids?.imdb_id || null;
      if (!imdb) return json(404, { message: "IMDb id not found for this TMDB id" }, origin);
    }

    if (!imdb) return json(400, { message: "Missing ?imdb or ?id" }, origin);

    const { data } = await axios.get("https://www.omdbapi.com/", {
      params: { i: imdb, plot: "full", apikey: OMDB },
      timeout: 8000
    });

    if (data.Response === "False") return json(404, { message: data.Error || "Not found" }, origin);

    const runtimeMins = parseInt(String(data.Runtime || "").replace(/\D/g, ""), 10);
    const genres = (data.Genre || "").split(",").map(s => s.trim()).filter(Boolean);

    const simplified = {
      tmdb_id: tmdbId ? Number(tmdbId) : null,
      imdb_id: data.imdbID,
      title: data.Title,
      overview: data.Plot,
      release_date: data.Released,
      year: data.Year,
      runtime: Number.isFinite(runtimeMins) ? runtimeMins : null,
      genres,
      vote_average: data.imdbRating ? Number(data.imdbRating) : null,
      poster_url: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      director: data.Director || null,
      actors: data.Actors || null
    };

    return json(200, simplified, origin);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data || err.message;
    return json(status, { message }, origin);
  }
}