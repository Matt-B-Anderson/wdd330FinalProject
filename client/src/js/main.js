import axios from "axios";
import { loadHeaderFooter } from "./utils.mjs";

const form = document.getElementById("searchForm");
const input = document.getElementById("q");
const info  = document.getElementById("resultsInfo");
const grid  = document.getElementById("resultsGrid");

const IMG_BASE = "https://image.tmdb.org/t/p/w342";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  renderLoading();
  info.textContent = "Searching…";

  try {
    const { data } = await axios.get(`/api/search`, { params: { q: query } });
    const results = Array.isArray(data?.results) ? data.results : [];
    renderResults(results);
    info.textContent = results.length
      ? `Found ${results.length} result${results.length === 1 ? "" : "s"} for “${query}”.`
      : `No results for “${query}”.`;
  } catch (err) {
    console.error(err);
    info.textContent = "Something went wrong. Please try again.";
    grid.innerHTML = "";
  }
});

function renderLoading() {
  grid.innerHTML = `
    <div class="movie-card">
      <div class="poster-fallback">Loading…</div>
      <div class="meta">
        <div class="title">Please wait</div>
        <div class="sub">Fetching results</div>
      </div>
    </div>`;
}

function renderResults(items) {
  grid.innerHTML = items.map(toCardHTML).join("");
}

function toCardHTML(m) {
  const title = m.title ?? "Untitled";
  const year  = (m.release_date || "").slice(0, 4);
  const rating = m.vote_average != null ? m.vote_average.toFixed(1) : "—";
  const hasPoster = !!m.poster_path;

  const imgHTML = hasPoster
    ? `<img src="${IMG_BASE}${m.poster_path}" alt="Poster for ${escapeHTML(title)}">`
    : `<div class="poster-fallback">No Image</div>`;

  return `
    <article class="movie-card" data-id="${m.id}">
      ${imgHTML}
      <div class="meta">
        <div class="title">${escapeHTML(title)}</div>
        <div class="sub">${year ? year + " • " : ""}⭐ ${rating}</div>
      </div>
    </article>
  `;
}

// simple escape for titles
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c) => (
    { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]
  ));
}


async function init(){
    await loadHeaderFooter();
}

init();
