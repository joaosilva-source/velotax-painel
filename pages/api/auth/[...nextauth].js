import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "consent", access_type: "offline", response_type: "code" }
      }
    })
  ],
  callbacks: {
    // Temporariamente sem restrição de domínio para diagnosticar o loop
    async signIn() { return true; },
    async session({ session }) {
      return session;
    }
  },
  // use default NextAuth pages (/api/auth/signin, etc.) to avoid redirect loops
  trustHost: true,
  debug: true,
  secret: process.env.NEXTAUTH_SECRET
});
