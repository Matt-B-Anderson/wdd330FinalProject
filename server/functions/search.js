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
    const q = (event.queryStringParameters?.q || "").trim();
    if (!q) return json(400, { message: "Missing query ?q" }, origin);

    const V4 = process.env.TMDB_V4_TOKEN;
    const V3 = process.env.TMDB_V3_KEY;
    if (!V4 && !V3) return json(500, { message: "TMDB credentials not configured" }, origin);

    const url = "https://api.themoviedb.org/3/search/movie";
    const opts = V4
      ? { headers: { Authorization: `Bearer ${V4}` }, params: { query: q, include_adult: false, language: "en-US", page: 1 }, timeout: 8000 }
      : { params: { api_key: V3, query: q, include_adult: false, language: "en-US", page: 1 }, timeout: 8000 };

    const { data } = await axios.get(url, opts);
    const results = Array.isArray(data?.results) ? data.results.map(m => ({
      id: m.id, title: m.title, release_date: m.release_date, poster_path: m.poster_path, vote_average: m.vote_average
    })) : [];

    return json(200, { results }, origin);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data || err.message;
    return json(status, { message }, origin);
  }
}