import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const clockInSchema = z.object({
  identifier: z.string().min(1),
  method: z.enum(["WEB", "NFC", "FINGERPRINT", "PIN"]),
  type: z.enum(["IN", "OUT"]),
  photoUrl: z.string().optional(),
  location: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { identifier, method, type, photoUrl, location } = clockInSchema.parse(body)

    // Verify user exists by ID, NFC, or PIN
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { nfcTagId: identifier },
          { pin: identifier },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create ClockIn record
    const clockIn = await prisma.clockIn.create({
      data: {
        userId: user.id,
        method,
        type,
        photoUrl,
        location,
      },
    })

    return NextResponse.json(clockIn)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
