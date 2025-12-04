import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const slotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
})

const scheduleSchema = z.object({
  userId: z.string().optional(), // Optional for Global Template
  dayOfWeek: z.number().min(0).max(6),
  slots: z.array(slotSchema),
  applyToAll: z.boolean().optional(), // Apply current day to all users
  applyWeekToAll: z.boolean().optional(), // Apply entire week to all users
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (userId) {
    // If userId is "GLOBAL", we search for where userId is null
    const whereClause = userId === "GLOBAL" ? { userId: null } : { userId }
    
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: { slots: true },
    })
    return NextResponse.json(schedules)
  }

  return NextResponse.json([])
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, dayOfWeek, slots, applyToAll, applyWeekToAll } = scheduleSchema.parse(body)

    // Handle "GLOBAL" string from UI by converting to null for DB
    const dbUserId = userId === "GLOBAL" ? null : userId

    if (applyToAll && dbUserId === null) {
      // ... existing applyToAll logic ...
    }

    if (applyWeekToAll && dbUserId === null) {
       // 1. Get ALL global schedules
       const globalSchedules = await prisma.schedule.findMany({
         where: { userId: null },
         include: { slots: true }
       })

       // 2. Get all users
       const users = await prisma.user.findMany()

       // 3. For each user, replace their entire schedule with global template
       for (const user of users) {
         // Delete all existing schedules for user
         await prisma.schedule.deleteMany({ where: { userId: user.id } })
         
         // Create new schedules based on global template
         for (const globalSchedule of globalSchedules) {
           await prisma.schedule.create({
             data: {
               userId: user.id,
               dayOfWeek: globalSchedule.dayOfWeek,
               slots: {
                 create: globalSchedule.slots.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
               }
             }
           })
         }
       }
    }

    // Always save the schedule itself (whether Global or User)
    // Delete existing
    await prisma.schedule.deleteMany({
      where: { userId: dbUserId, dayOfWeek },
    })

    // Create new
    const schedule = await prisma.schedule.create({
      data: {
        userId: dbUserId,
        dayOfWeek,
        slots: {
          create: slots,
        },
      },
      include: { slots: true },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error saving schedule" }, { status: 400 })
  }
}
