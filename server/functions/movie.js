import axios from "axios";

export async function handler(event) {
  const tmdbId = event.queryStringParameters?.id;
  const imdbId = event.queryStringParameters?.imdb;

  const OMDB_KEY = process.env.OMDB_API_KEY;
  const TMDB_V4  = process.env.TMDB_V4_TOKEN;
  const TMDB_V3  = process.env.TMDB_V3_KEY;

  if (!OMDB_KEY) {
    return { statusCode: 500, body: JSON.stringify({ message: "OMDB_API_KEY not configured" }) };
  }

  try {
    let imdb = imdbId;
    if (!imdb && tmdbId) {
      if (!TMDB_V4 && !TMDB_V3) {
        return { statusCode: 500, body: JSON.stringify({ message: "TMDB key/token required to resolve IMDb id" }) };
      }
      const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}`;
      const opts = TMDB_V4
        ? { headers: { Authorization: `Bearer ${TMDB_V4}` }, params: { append_to_response: "external_ids" } }
        : { params: { api_key: TMDB_V3, append_to_response: "external_ids" } };

      const { data: m } = await axios.get(url, opts);
      imdb = m.imdb_id || m.external_ids?.imdb_id || null;
      if (!imdb) {
        return { statusCode: 404, body: JSON.stringify({ message: "IMDb id not found for this TMDB id" }) };
      }
    }

    if (!imdb && !tmdbId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing ?imdb or ?id" }) };
    }

    const { data } = await axios.get("https://www.omdbapi.com/", {
      params: { i: imdb, plot: "full", apikey: OMDB_KEY }
    });

    if (data.Response === "False") {
      return { statusCode: 404, body: JSON.stringify({ message: data.Error || "Not found" }) };
    }

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

    return { statusCode: 200, body: JSON.stringify(simplified) };
  } catch (err) {
    const status = err.response?.status || 500;
    const msg = err.response?.data || err.message;
    return { statusCode: status, body: JSON.stringify({ message: msg }) };
  }
}