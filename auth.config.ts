import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")

            // Admin protection (DISABLED TEMPORARILY)
            // if (isOnAdmin) {
            //     if (isLoggedIn) return true
            //     return false // Redirect unauthenticated users to login page
            // }

            // Allow all routes (admin login disabled)
            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
