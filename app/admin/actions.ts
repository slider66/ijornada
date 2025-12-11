"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function getAdminDashboardStats() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Active Workers: Users with latest ClockIn type 'IN'
    const users = await prisma.user.findMany({
        where: { role: { not: "ADMIN" } }, // Assuming we only track non-admins, or remove this if admins also clock in
        include: {
            clockIns: {
                take: 1,
                orderBy: { timestamp: "desc" },
            },
        },
    });

    const activeWorkers = users.filter((u) => {
        const lastClockIn = u.clockIns[0];
        return lastClockIn && lastClockIn.type === "IN";
    }).length;

    // 2. Fichajes Hoy: Total clock-ins today
    const fichajesToday = await prisma.clockIn.count({
        where: {
            timestamp: {
                gte: todayStart,
                lte: todayEnd,
            },
            type: "IN", // Usually "fichajes" refers to coming in, or both? "Fichajes" is clock-ins. 
            // If we count both IN and OUT, it might be double the "attendance". 
            // Usually "Fichajes Hoy" implies individual punch events. I'll count ALL (IN and OUT).
            // Or maybe unique users clocked in today?
            // "Fichajes Hoy" usually means "Clock-in events". I'll count all.
        },
    });

    // 3. Incidencias Pendientes
    const pendingIncidents = await prisma.incident.count({
        where: {
            status: "PENDING",
        },
    });

    // 4. Upcoming Events (Holidays & Vacations) - Next 15 days
    const next15DaysEnd = new Date(now);
    next15DaysEnd.setDate(now.getDate() + 15);

    const upcomingHolidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: todayStart,
                lte: next15DaysEnd,
            },
        },
    });

    const upcomingVacations = await prisma.incident.findMany({
        where: {
            OR: [
                { type: { contains: "vacaci", mode: "insensitive" } },
                { type: { contains: "vacation", mode: "insensitive" } }
            ],
            startDate: {
                gte: todayStart,
                lte: next15DaysEnd,
            },
        },
        include: {
            user: { select: { name: true } }
        }
    });

    const upcomingEvents = [
        ...upcomingHolidays.map(h => ({
            id: h.id,
            date: h.date,
            title: `Festivo: ${h.name}`,
            type: "holiday"
        })),
        ...upcomingVacations.map(v => ({
            id: v.id,
            date: v.startDate,
            title: `Vacaciones: ${v.user.name}`,
            type: "vacation"
        }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
        activeWorkers,
        fichajesToday,
        pendingIncidents,
        upcomingEvents,
    };
}

