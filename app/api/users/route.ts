import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateEAN13 } from "@/lib/ean13"

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  nfcTagId: z.string().optional(),
  pin: z.string().optional(),
  qrToken: z.string().optional(),
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

    // Handle empty fields as null to avoid unique constraint violations
    // Zod optional() returns undefined, but Prisma expects null for nullable fields if explicitly passed
    const userData = {
      ...data,
      email: data.email || null,
      pin: data.pin || null,
      nfcTagId: data.nfcTagId || null,
      qrToken: data.qrToken || generateEAN13(),
    }

    const user = await prisma.user.create({
      data: userData,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error creating user" }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...rest } = body

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const data = userSchema.parse(rest)

    // Handle empty fields as null
    const userData = {
      ...data,
      email: data.email || null,
      pin: data.pin || null,
      nfcTagId: data.nfcTagId || null,
      qrToken: data.qrToken || undefined, // Only update if provided, otherwise keep existing (handled by Prisma if undefined? No, need to be careful)
    }

    const user = await prisma.user.update({
      where: { id },
      data: userData,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error updating user" }, { status: 400 })
  }
}
