import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) return null;

        // Check if password matches KEY_ADMIN env var (Master Key)
        const isMasterKey = process.env.KEY_ADMIN && credentials.password === process.env.KEY_ADMIN;

        // OR check database hash
        const isValid = isMasterKey || (user.password && await compare(credentials.password as string, user.password));

        if (isValid) return user;

        console.log("Invalid credentials for:", credentials.email);
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
})
