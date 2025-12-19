
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const users = await req.json()

    if (!Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of users." }, { status: 400 })
    }

    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        // Prepare user data clearing nulls or fields that shouldn't be touched if empty
        const userData = {
           name: user.name,
           email: user.email || null,
           role: user.role || "USER",
           pin: user.pin || null,
           nfcTagId: user.nfcTagId || null,
           qrToken: user.qrToken || null,
           vacationDays: user.vacationDays ?? 30,
        }

        // Upsert based on email if present, otherwise try to match by ID if meaningful, 
        // usually import implies new or update. Let's use email as key if exists, or just create.
        // Actually, for simplicity and conflict avoidance, let's try to upsert by unique fields if they exist.
        // BUT, Prisma upsert requires a unique "where".
        
        // Strategy: 
        // 1. If user has ID and it exists -> Update
        // 2. If user has email and it exists -> Update
        // 3. Create new

        let existingUser = null
        if (user.id) {
            existingUser = await prisma.user.findUnique({ where: { id: user.id } })
        }
        if (!existingUser && user.email) {
            existingUser = await prisma.user.findUnique({ where: { email: user.email } })
        }

        if (existingUser) {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: userData
            })
        } else {
            await prisma.user.create({
                data: userData
            })
        }
        successCount++
      } catch (e) {
        console.error(`Error importing user ${user.name}:`, e)
        errorCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${successCount} users. Failed: ${errorCount}`,
      stats: { success: successCount, failure: errorCount }
    })
  } catch (error) {
    console.error("Error importing workers:", error)
    return NextResponse.json({ error: "Failed to import workers" }, { status: 500 })
  }
}
