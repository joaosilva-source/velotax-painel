import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// So adiciona Google se as credenciais existirem (evita 500 na Vercel sem config)
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

export default NextAuth({
  providers,
  callbacks: {
    async signIn() { return true; },
    async session({ session }) { return session; }
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret-painel',
  // Vercel: VERCEL_URL = "velotax-painel-eta.vercel.app" (sem https). Garantir NEXTAUTH_URL na Vercel evita 500.
  url: process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
});
