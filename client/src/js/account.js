import axios from "axios";
import { loadHeaderFooter, initAuthNav, wireNavDetailsLink, initNavMenu } from "./utils.mjs";

const el = (id) => document.getElementById(id);
const authSec = el("auth");
const acctSec = el("account");
const msg = el("authMsg");
const grid = el("watchGrid");

async function checkSession() {
  const res = await axios.get("/api/user", {
    validateStatus: s => s === 200 || s === 401
  });

  if (res.status === 200) {
    authSec.hidden = true;
    acctSec.hidden = false;
    await loadWatchList();           
  } else {
    acctSec.hidden = true;
    authSec.hidden = false;
  }
}

async function loadWatchList() {
  const res = await axios.get("/api/watched", {
    withCredentials: true,
    validateStatus: s => [200, 401, 404].includes(s)
  });

  if (res.status === 401) {
    authSec.hidden = false; acctSec.hidden = true;
    return;
  }

  const items = res.status === 404 ? [] : (res.data?.results ?? []);
  grid.innerHTML = items.length ? items.map(cardHTML).join("") : emptyStateHTML();
}

function emptyStateHTML() {
  return `
    <div style="grid-column: 1 / -1; display:grid; place-items:center; padding:2rem;">
      <p style="margin-bottom: .75rem;">You haven’t added any movies yet.</p>
      <a class="btn secondary" href="/">Search movies</a>
    </div>
  `;
}

function cardHTML(m) {
  const title = m.title ?? `TMDB #${m.tmdb_id}`;
  const poster = m.poster_path
    ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
    : null;

  return `
    <div class="card" data-id="${m.tmdb_id}">
      <a href="/movie.html?id=${m.tmdb_id}">
        ${poster
          ? `<img src="${poster}" alt="Poster for ${escapeHtml(title)}">`
          : `<div style="height:240px;display:grid;place-items:center;background:#111;color:#fff">No image</div>`
        }
      </a>
      <div class="meta">
        <div class="row" style="justify-content:space-between; align-items:center;">
          <span>${escapeHtml(title)}</span>
          <button class="btn danger remove-btn" type="button" data-id="${m.tmdb_id}">Remove</button>
        </div>
      </div>
    </div>`;
}

el("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  const email = el("email").value.trim();
  const password = el("password").value;
  try {
    await axios.post("/api/login", { email, password }, { withCredentials: true });
    await checkSession();
  } catch (err) {
    msg.textContent = err.response?.data?.message || "Login failed";
  }
});

el("signupBtn").addEventListener("click", async () => {
  msg.textContent = "";
  const email = el("email").value.trim();
  const password = el("password").value;
  if (!email || !password) { msg.textContent = "Enter email & password"; return; }
  try {
    await axios.post("/api/signup", { email, password }, { withCredentials: true });
    await checkSession();
  } catch (err) {
    msg.textContent = err.response?.data?.message || "Sign up failed";
  }
});

grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;

  e.preventDefault();
  const id = Number(btn.dataset.id);
  const card = btn.closest('.card');
  btn.disabled = true;

  const res = await axios.delete('/api/watched', {
    data: { tmdb_id: id },
    withCredentials: true,
    validateStatus: s => [200, 401, 404].includes(s)
  });

  if (res.status === 200 || res.status === 404) {
    card.remove();
    if (!grid.querySelector('.card')) {
      grid.innerHTML = emptyStateHTML();
    }
  } else if (res.status === 401) {
    location.href = '/account';
  } else {
    btn.disabled = false;
    btn.textContent = 'Try again';
  }
});


function escapeHtml(s=""){return s.replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));}

checkSession();

async function init(){
    await loadHeaderFooter();
    initNavMenu();
    initAuthNav();
    wireNavDetailsLink();
}

init();