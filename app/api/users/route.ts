import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateEAN13 } from "@/lib/ean13"
import { logAction } from "@/lib/audit"

export const dynamic = 'force-dynamic'

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
    include: {
      clockIns: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
      incidents: true,
    },
    orderBy: { name: "asc" },
  })

  const usersWithStatus = users.map((user) => {
    const lastClockIn = user.clockIns[0]
    const isWorking = lastClockIn && lastClockIn.type === "IN"

    // Calculate vacation days
    const vacationDays = user.incidents
      .filter(i => i.type.toLowerCase().includes("vacaci"))
      .reduce((acc, curr) => {
        const start = new Date(curr.startDate);
        const end = curr.endDate ? new Date(curr.endDate) : start;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return acc + diffDays;
      }, 0);

    return {
      ...user,
      status: isWorking ? "working" : "offline",
      vacationDays,
      // Remove heavy incidents array from response if not needed
      incidents: undefined
    }
  })

  return NextResponse.json(usersWithStatus)
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

    await logAction("CREATE_USER", `User ${user.email} (${user.name}) created`, "ADMIN");

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

    await logAction("UPDATE_USER", `User ${user.email} (${user.name}) updated`, "ADMIN");

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error updating user" }, { status: 400 })
  }
}
