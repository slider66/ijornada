import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const userId = searchParams.get("userId")

  const where: any = {}

  if (from && to) {
    where.timestamp = {
      gte: new Date(from),
      lte: new Date(to),
    }
  }

  if (userId && userId !== "all") {
    where.userId = userId
  }

  const clockIns = await prisma.clockIn.findMany({
    where,
    include: { user: true },
    orderBy: { timestamp: "desc" },
  })

  // Generate CSV
  const csvHeader = "ID,Trabajador,Email,Tipo,Metodo,Fecha,Hora,Ubicacion\n"
  const csvRows = clockIns.map(c => {
    const date = c.timestamp.toISOString().split('T')[0]
    const time = c.timestamp.toISOString().split('T')[1].split('.')[0]
    return `${c.id},${c.user.name},${c.user.email || ""},${c.type},${c.method},${date},${time},${c.location || ""}`
  }).join("\n")

  const csvContent = csvHeader + csvRows

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fichajes-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
