import { q } from "./_db.js";

export async function handler() {
  try {
    const { rows } = await q("select 1 as ok");
    return { statusCode: 200, body: JSON.stringify(rows[0]) };
  } catch (err) {
    const msg = err?.message || String(err);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
}