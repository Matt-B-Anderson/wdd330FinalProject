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