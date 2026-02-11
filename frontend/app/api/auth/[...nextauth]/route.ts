import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async jwt({ token, account }) {
      // Store Google ID token on first sign-in for backend verification
      if (account?.provider === 'google' && account.id_token) {
        token.googleIdToken = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      // Expose Google ID token to the client for backend verification
      session.googleIdToken = token.googleIdToken as string
      return session
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/auth/callback?success=true`
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
