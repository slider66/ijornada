import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const clockIns = await prisma.clockIn.findMany({
    include: { user: true },
    orderBy: { timestamp: "desc" },
  })

  // Generate CSV
  const csvHeader = "ID,User,Email,Type,Method,Timestamp,Location\n"
  const csvRows = clockIns.map(c => {
    return `${c.id},${c.user.name},${c.user.email},${c.type},${c.method},${c.timestamp.toISOString()},${c.location || ""}`
  }).join("\n")

  const csvContent = csvHeader + csvRows

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="fichajes-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
