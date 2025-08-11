import { clearCookie } from "./_auth.js";
export async function handler() {
  return { statusCode: 200, headers: { "Set-Cookie": clearCookie() }, body: "ok" };
}