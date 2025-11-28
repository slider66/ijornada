import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const incidentSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().optional().transform(str => str ? new Date(str) : null),
})

export async function GET() {
  const incidents = await prisma.incident.findMany({
    include: { user: true },
    orderBy: { startDate: "desc" },
  })
  return NextResponse.json(incidents)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = incidentSchema.parse(body)
    
    const incident = await prisma.incident.create({
      data: {
        ...data,
        status: "APPROVED", // Auto-approve for admin creation
      },
    })
    
    return NextResponse.json(incident)
  } catch (error) {
    return NextResponse.json({ error: "Error creating incident" }, { status: 400 })
  }
}
