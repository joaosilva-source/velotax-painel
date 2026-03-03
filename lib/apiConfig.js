/**
 * URL da API WhatsApp. Usado no build (NEXT_PUBLIC_*).
 * Na Vercel: definir NEXT_PUBLIC_API_URL nas variáveis de ambiente.
 */
const DEFAULT_API_URL = "https://whatsapp-api-new-54aw.onrender.com";

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

/** Headers para chamadas à API (inclui header do ngrok free para evitar 404). */
export function getApiHeaders() {
  const headers = { "Content-Type": "application/json" };
  const url = getApiUrl();
  if (url && url.includes("ngrok")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }
  return headers;
}
