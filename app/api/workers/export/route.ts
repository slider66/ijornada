
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    })
    
    // Create a filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `workers_export_${timestamp}.json`

    return new NextResponse(JSON.stringify(users, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting workers:", error)
    return NextResponse.json({ error: "Failed to export workers" }, { status: 500 })
  }
}
