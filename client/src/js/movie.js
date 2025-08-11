import axios from "axios";
import { loadHeaderFooter, initAuthNav } from "./utils.mjs";

const params = new URLSearchParams(location.search);
const tmdbId = params.get("id");       // from your search cards
const imdbId = params.get("imdb");     // optional direct IMDb link

const hero = document.getElementById("hero");
const titleEl = hero.querySelector(".hero-title");
const poster = document.getElementById("poster");
const info = document.getElementById("info");

(async function init() {
    if (!tmdbId && !imdbId) {
        titleEl.textContent = "Missing movie id";
        return;
    }
    try {
        const { data: m } = await axios.get(`/api/movie`, { params: { id: tmdbId, imdb: imdbId } });

        document.title = `${m.title} – Movie Details`;
        titleEl.textContent = m.title || "Untitled";

        if (m.poster_url) {
            hero.style.backgroundImage =
                `linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.15)), url(${m.poster_url})`;
        }

        poster.innerHTML = m.poster_url
            ? `<img src="${m.poster_url}" alt="Poster for ${esc(m.title)}">`
            : `<div style="display:grid;place-items:center;height:100%;color:#fff;background:#111">No image</div>`;

        const year = m.year || (m.release_date || "").slice(0, 4);
        const mins = m.runtime ? `${m.runtime} min` : "";
        const genres = (m.genres || []).map(g => `<span class="tag">${esc(g)}</span>`).join("");

        info.innerHTML = `
      <div class="subtle">${[year, mins].filter(Boolean).join(" • ")}${m.director ? " • Dir. " + esc(m.director) : ""}</div>
      ${genres ? `<div class="tags">${genres}</div>` : ""}
      <p>${esc(m.overview || "No overview available.")}</p>
      <div class="subtle">⭐ ${Number.isFinite(m.vote_average) ? m.vote_average.toFixed(1) : (m.vote_average ?? "—")}</div>
      ${m.actors ? `<div class="subtle">Cast: ${esc(m.actors)}</div>` : ""}
      <!-- Optional actions -->
      <!--<button class="btn">Mark as watched</button>-->
    `;
    } catch (err) {
        console.error(err);
        titleEl.textContent = "Couldn’t load movie";
        info.innerHTML = `<p>Sorry, something went wrong loading this movie.</p>`;
    }
})();

function esc(s = "") { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])); }

async function init(){
    await loadHeaderFooter();
    initAuthNav();
}

init();