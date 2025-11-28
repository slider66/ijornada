import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  nfcTagId: z.string().optional(),
  pin: z.string().optional(),
  role: z.string().default("USER"),
})

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = userSchema.parse(body)
    
    const user = await prisma.user.create({
      data,
    })
    
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Error creating user" }, { status: 400 })
  }
}
