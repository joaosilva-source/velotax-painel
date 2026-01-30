import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Só adiciona Google se as credenciais existirem (evita 500 na Vercel sem config)
const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const providers = hasGoogle
  ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: { prompt: "consent", access_type: "offline", response_type: "code" }
        }
      })
    ]
  : [];

// URL do app: obrigatório na Vercel para /api/auth/session não retornar 500
const baseUrl = process.env.NEXTAUTH_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);

export default NextAuth({
  providers,
  callbacks: {
    async signIn() { return true; },
    async session({ session }) { return session; }
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret-painel',
  url: baseUrl || undefined
});
