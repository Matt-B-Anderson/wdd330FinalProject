import { getRecent, DETAILS_KEY } from "./recent.mjs";
import axios from "axios";
axios.defaults.withCredentials = true;

export function renderWithTemplate(template, parentElement, data, callback) {
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }
}

export async function loadTemplate(path) {
  const res = await fetch(path);
  const template = await res.text();
  return template;
}

export async function loadHeaderFooter() {
  const headerTemplate = await loadTemplate("/partials/header.html");

  const headerElement = document.querySelector("#main-header");

  renderWithTemplate(headerTemplate, headerElement);

  const footerTemplate = await loadTemplate("/partials/footer.html");
  const footerElement = document.querySelector("#main-footer");
  renderWithTemplate(footerTemplate, footerElement);
}

export async function initAuthNav() {
  const res = await axios.get("/api/user", { validateStatus: s => s === 200 || s === 401 });
  const authed = res.status === 200;

  document.querySelectorAll(".authed-only").forEach(el => (el.hidden = !authed));
  document.querySelectorAll(".guest-only").forEach(el => (el.hidden = authed));

  const logoutBtn = document.getElementById("nav-logout");
  if (authed && logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await axios.post("/api/logout", {}, { withCredentials: true });
      } finally {
        location.href = "/";
      }
    });
  }
}

export function wireNavDetailsLink() {
  const link = document.querySelector('nav a[href="/movie.html"], nav a[href="/movie"]');
  if (!link) return;

  const recent = getRecent(sessionStorage.getItem(DETAILS_KEY));
  if (recent?.id) {
    const url = new URL("/movie.html", location.origin);
    url.searchParams.set("id", recent.id);
    link.setAttribute("href", `${url.pathname}${url.search}`);
  } else {
    link.setAttribute("href", "/");
  }
}

export function initNavMenu() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  let scrim = document.querySelector('.nav-scrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.className = 'nav-scrim';
    document.body.appendChild(scrim);
  }

  const openNav = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    scrim.classList.toggle('show', open);
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    openNav(!open);
  });

  // close when clicking a link or scrim
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a,button.nav-linklike')) openNav(false);
  });
  scrim.addEventListener('click', () => openNav(false));
}