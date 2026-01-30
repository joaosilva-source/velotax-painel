/**
 * URL da API WhatsApp (Render). Único ponto de configuração.
 * Na Vercel: defina NEXT_PUBLIC_API_URL = https://whatsapp-api-new-54aw.onrender.com
 */
export const DEFAULT_API_URL = 'https://whatsapp-api-new-54aw.onrender.com';

export function getApiUrl() {
  const url = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  return url;
}
