import axios from "axios";
import { loadHeaderFooter, initAuthNav } from "./utils.mjs";
import { getRecent, SEARCH_KEY, DETAILS_KEY } from "./recent.mjs";

const params = new URLSearchParams(location.search);
let tmdbId = params.get("id");
let imdbId = params.get("imdb");
const hasId = params.has("id") || params.has("imdb");

const hero = document.getElementById("hero");
const titleEl = hero.querySelector(".hero-title");
const poster = document.getElementById("poster");
const info = document.getElementById("info");

(async function init() {
    await loadHeaderFooter();
    await initAuthNav();
    const recentClick = getRecent(sessionStorage.getItem(DETAILS_KEY));
    const fallbackTmdbId = recentClick?.id ? String(recentClick.id) : null;
    if (!hasId) {
        if (!recentClick) {
            location.replace("/");
        } else location.replace(`/movie/?id=${recentClick.id}`)
    }

    const queryParams = imdbId ? { imdb: qsImdb } : (tmdbId || fallbackTmdbId) ? { id: tmdbId || fallbackTmdbId } : null;

    try {
        const { data: m } = await axios.get(`/api/movie`, { params: queryParams });

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
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn';
        toggleBtn.id = 'watchedToggle';
        toggleBtn.textContent = 'Mark as watched';
        info.appendChild(toggleBtn);

        let alreadyWatched = false;
        try {
            const res = await axios.get('/api/watched', {
                withCredentials: true,
                validateStatus: s => [200, 401].includes(s)
            });
            if (res.status === 200) {
                alreadyWatched = (res.data?.results || []).some(r => r.tmdb_id === Number(tmdbId));
                if (alreadyWatched) toggleBtn.textContent = 'Remove from watched';
            }
        } catch { }

        toggleBtn.addEventListener('click', async () => {
            toggleBtn.disabled = true;

            if (!alreadyWatched) {
                const res = await axios.post('/api/watched',
                    { tmdb_id: Number(tmdbId) },
                    { withCredentials: true, validateStatus: s => [200, 401].includes(s) }
                );
                if (res.status === 401) {
                    const back = encodeURIComponent(location.pathname + location.search);
                    location.href = `/account?redirect=${back}`;
                    return;
                }
                alreadyWatched = true;
                toggleBtn.textContent = 'Remove from watched';
                toggleBtn.disabled = false;
            } else {
                const res = await axios.delete('/api/watched', {
                    data: { tmdb_id: Number(tmdbId) },
                    withCredentials: true,
                    validateStatus: s => [200, 401, 404].includes(s)
                });
                if (res.status === 401) {
                    const back = encodeURIComponent(location.pathname + location.search);
                    location.href = `/account?redirect=${back}`;
                    return;
                }
                alreadyWatched = false;
                toggleBtn.textContent = 'Mark as watched';
                toggleBtn.disabled = false;
            }
        });
    } catch (err) {
        console.error(err);
        titleEl.textContent = "Couldn’t load movie";
        info.innerHTML = `<p>Sorry, something went wrong loading this movie.</p>`;
    }
})();

function esc(s = "") { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])); }