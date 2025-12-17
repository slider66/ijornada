import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
    // Matcher ignoring internal Next.js paths and static files
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
