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
    async signIn({ account, profile }) {
      const domain = process.env.ALLOWED_DOMAIN || "";
      const email = profile?.email || "";
      if (!domain) return false;
      return email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
    },
    async session({ session }) {
      return session;
    }
  },
  pages: {
    signIn: "/api/auth/signin"
  },
  secret: process.env.NEXTAUTH_SECRET
});
