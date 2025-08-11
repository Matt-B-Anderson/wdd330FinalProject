export const SEARCH_KEY = "recentSearch";
export const DETAILS_KEY = "recentDetailsNav";
export const TTL_MS = 5 * 60 * 1000;

export function rememberSearch(q) {
  localStorage.setItem(SEARCH_KEY, JSON.stringify({ q, ts: Date.now() }));
}

export function rememberDetailsClick(id) {
  sessionStorage.setItem(DETAILS_KEY, JSON.stringify({ id, ts: Date.now() }));
}

export function getRecent(objStr, ttl = TTL_MS) {
  try {
    const obj = JSON.parse(objStr || "null");
    return obj && Date.now() - obj.ts < ttl ? obj : null;
  } catch { return null; }
}