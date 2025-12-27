"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { revalidatePath } from "next/cache";

export async function checkAndGenerateAbsences() {


    // 1. Determine Start Date (Pilot Start or 30 days ago)
    const config = await prisma.systemConfig.findUnique({ where: { key: "PILOT_START_DATE" } });
    let startDate = subDays(new Date(), 30);
    if (config?.value) {
        const pilotStart = new Date(config.value);
        if (pilotStart > startDate) startDate = pilotStart;
    }
    startDate = startOfDay(startDate);

    // End date is Yesterday (don't mark today as absent until it's over)
    const endDate = endOfDay(subDays(new Date(), 1));

    if (startDate > endDate) return { count: 0 };

    const users = await prisma.user.findMany({
        include: { schedules: { include: { slots: true } } }
    });

    const holidays = await prisma.holiday.findMany({
        where: { date: { gte: startDate, lte: endDate } }
    });

    // Fetch company closures in range
    const closures = await prisma.companyClosure.findMany({
        where: {
            OR: [
                { startDate: { lte: endDate }, endDate: { gte: startDate } }
            ]
        }
    });

    // Fetch all incidents in range to avoid duplicates
    const existingIncidents = await prisma.incident.findMany({
        where: {
            startDate: { lte: endDate },
            endDate: { gte: startDate } // Overlapping logic
        }
    });

    // Fetch all clockins
    const clockIns = await prisma.clockIn.findMany({
        where: { timestamp: { gte: startDate, lte: endDate } }
    });

    const daysToCheck = eachDayOfInterval({ start: startDate, end: endDate });
    let createdCount = 0;

    for (const user of users) {
        // Skip users created after the check date

        for (const day of daysToCheck) {
            if (day < startOfDay(user.createdAt)) continue;

            // Check duplicates
            const hasIncident = existingIncidents.some(i =>
                i.userId === user.id &&
                i.startDate <= endOfDay(day) &&
                (i.endDate ? i.endDate >= startOfDay(day) : true) // Null endDate usually means single day or open? Assuming not null for now or specific logic.
                // If endDate is null in DB schema it is nullable. 
                // Usually "Falta" is single day. "Baja" might be open.
                // Let's assume if existing incident covers this day.
            );
            if (hasIncident) continue;

            const isHoliday = holidays.some(h => isSameDay(h.date, day));
            if (isHoliday) continue;

            const isClosure = closures.some(c => 
                c.startDate <= endOfDay(day) && c.endDate >= startOfDay(day)
            );
            if (isClosure) continue;

            // Check Schedule
            const dayOfWeek = day.getDay();
            const schedule = user.schedules.find(s => s.dayOfWeek === dayOfWeek);
            if (!schedule || schedule.slots.length === 0) continue; // Not a working day

            // Check ClockIns
            const hasClockIn = clockIns.some(c =>
                c.userId === user.id && isSameDay(c.timestamp, day)
            );
            if (hasClockIn) continue;

            // If we are here: Scheduled Work Day, No Holiday, No Closure, No Incident, No ClockIn -> FALTA
            await prisma.incident.create({
                data: {
                    userId: user.id,
                    type: "FALTA",
                    startDate: day, // Store as noon to be safe from TZ issues or just start of day
                    endDate: endOfDay(day),
                    status: "GENERATED",
                    description: "Falta de asistencia detectada automáticamente"
                }
            });
            createdCount++;
        }
    }

    return { count: createdCount };
}

export async function updateIncidentType(id: string, newType: string) {
    await prisma.incident.update({
        where: { id },
        data: {
            type: newType,
            status: "REVIEWED" // Mark as reviewed so it's not strictly "GENERATED" anymore if manually changed
        }
    });
    revalidatePath("/admin/incidents");
    return { success: true };
}
