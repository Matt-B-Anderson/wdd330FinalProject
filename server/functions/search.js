import axios from 'axios';
import 'dotenv/config';

export async function handler(event, context) {
  const q = (event.queryStringParameters?.q || "").trim();
  if (!q) return { statusCode: 400, body: JSON.stringify({ message: "Missing ?q" }) };

  const v4 = process.env.TMDB_V4_TOKEN;
  const v3 = process.env.TMDB_V3_KEY;

  if (!v4 && !v3) {
    return { statusCode: 500, body: JSON.stringify({ message: "TMDB credentials not configured" }) };
  }

  try {
    const url = "https://api.themoviedb.org/3/search/movie";

    const opts = v4
      ? {
          headers: { Authorization: `Bearer ${v4}` },
          params: { query: q, include_adult: false, language: "en-US", page: 1 }
        }
      : {
          params: { api_key: v3, query: q, include_adult: false, language: "en-US", page: 1 }
        };

    const { data } = await axios.get(url, opts);
    return { statusCode: 200, body: JSON.stringify({ results: data.results ?? [] }) };
  } catch (err) {
    const status = err.response?.status || 500;
    const msg = err.response?.data || err.message;
    return { statusCode: status, body: JSON.stringify({ message: msg }) };
  }
}