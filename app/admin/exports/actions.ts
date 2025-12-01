"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, isSameDay, differenceInMinutes, format } from "date-fns";
import { es } from "date-fns/locale";

export type DashboardStats = {
    totalUsers: number;
    totalWorkedMinutes: number;
    totalExpectedMinutes: number;
    balanceMinutes: number;
    incidentCounts: {
        vacation: number;
        sick: number;
        absence: number;
        other: number;
    };
    userStats: UserStat[];
};

export type UserStat = {
    userId: string;
    userName: string;
    workedMinutes: number;
    expectedMinutes: number;
    balanceMinutes: number;
    incidents: {
        vacation: number;
        sick: number;
        absence: number;
        other: number;
    };
    dailyBreakdown?: DailyStat[];
};

export type DailyStat = {
    date: string;
    dayName: string;
    workedMinutes: number;
    expectedMinutes: number;
    balanceMinutes: number;
    status: "ok" | "missing" | "extra" | "incident" | "holiday" | "off";
    incidentType?: string;
};

export async function getDashboardStats(
    from: Date,
    to: Date,
    userId?: string
): Promise<DashboardStats> {
    const startDate = startOfDay(from);
    const endDate = endOfDay(to);

    // Fetch users
    const whereUser = userId && userId !== "all" ? { id: userId } : {};
    const users = await prisma.user.findMany({
        where: whereUser,
        include: {
            schedules: {
                include: { slots: true },
            },
        },
    });

    // Fetch data for the range
    const clockIns = await prisma.clockIn.findMany({
        where: {
            timestamp: { gte: startDate, lte: endDate },
            userId: userId && userId !== "all" ? userId : undefined,
        },
        orderBy: { timestamp: "asc" },
    });

    const incidents = await prisma.incident.findMany({
        where: {
            startDate: { lte: endDate },
            endDate: { gte: startDate }, // Overlapping range
            userId: userId && userId !== "all" ? userId : undefined,
        },
    });

    // Fetch holidays (optional, if implemented)
    const holidays = await prisma.holiday.findMany({
        where: {
            date: { gte: startDate, lte: endDate },
        },
    });

    const stats: DashboardStats = {
        totalUsers: users.length,
        totalWorkedMinutes: 0,
        totalExpectedMinutes: 0,
        balanceMinutes: 0,
        incidentCounts: { vacation: 0, sick: 0, absence: 0, other: 0 },
        userStats: [],
    };

    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

    for (const user of users) {
        const userStat: UserStat = {
            userId: user.id,
            userName: user.name,
            workedMinutes: 0,
            expectedMinutes: 0,
            balanceMinutes: 0,
            incidents: { vacation: 0, sick: 0, absence: 0, other: 0 },
            dailyBreakdown: [],
        };

        for (const day of daysInRange) {
            // Skip days before user creation
            if (day < startOfDay(user.createdAt)) {
                continue;
            }

            const dayOfWeek = day.getDay(); // 0 = Sunday
            const dateStr = format(day, "yyyy-MM-dd");

            // 1. Check Incidents
            const activeIncident = incidents.find(
                (i) =>
                    i.userId === user.id &&
                    i.startDate <= endOfDay(day) &&
                    (i.endDate ? i.endDate >= startOfDay(day) : true)
            );

            // 2. Check Holidays
            const isHoliday = holidays.some((h) => isSameDay(h.date, day));

            // 3. Calculate Expected Minutes
            let expectedMinutes = 0;
            // Only expect hours if no incident and no holiday
            if (!activeIncident && !isHoliday) {
                const schedule = user.schedules.find((s) => s.dayOfWeek === dayOfWeek);
                if (schedule) {
                    for (const slot of schedule.slots) {
                        const [startH, startM] = slot.startTime.split(":").map(Number);
                        const [endH, endM] = slot.endTime.split(":").map(Number);
                        expectedMinutes += (endH * 60 + endM) - (startH * 60 + startM);
                    }
                }
            }

            // 4. Calculate Worked Minutes
            let workedMinutes = 0;
            const userDayClockIns = clockIns.filter(
                (c) => c.userId === user.id && isSameDay(c.timestamp, day)
            );

            // Simple pair logic: IN -> OUT
            // If odd number, ignore last IN or assume ongoing (for now ignore)
            for (let i = 0; i < userDayClockIns.length; i += 2) {
                const start = userDayClockIns[i];
                const end = userDayClockIns[i + 1];
                if (start && start.type === "IN" && end && end.type === "OUT") {
                    workedMinutes += differenceInMinutes(end.timestamp, start.timestamp);
                }
            }

            // Update User Totals
            userStat.workedMinutes += workedMinutes;
            userStat.expectedMinutes += expectedMinutes;

            // Update Incident Counts
            if (activeIncident) {
                const type = activeIncident.type.toLowerCase();
                if (type.includes("vacaci")) userStat.incidents.vacation++;
                else if (type.includes("baja") || type.includes("enfermedad")) userStat.incidents.sick++;
                else if (type.includes("falta") || type.includes("ausencia")) userStat.incidents.absence++;
                else userStat.incidents.other++;
            }

            // Daily Breakdown
            let status: DailyStat["status"] = "ok";
            if (activeIncident) status = "incident";
            else if (isHoliday) status = "holiday";
            else if (expectedMinutes === 0 && workedMinutes === 0) status = "off";
            else if (workedMinutes < expectedMinutes) status = "missing";
            else if (workedMinutes > expectedMinutes) status = "extra";

            userStat.dailyBreakdown?.push({
                date: dateStr,
                dayName: format(day, "EEEE", { locale: es }),
                workedMinutes,
                expectedMinutes,
                balanceMinutes: workedMinutes - expectedMinutes,
                status,
                incidentType: activeIncident?.type,
            });
        }

        userStat.balanceMinutes = userStat.workedMinutes - userStat.expectedMinutes;

        // Add to Global Stats
        stats.totalWorkedMinutes += userStat.workedMinutes;
        stats.totalExpectedMinutes += userStat.expectedMinutes;
        stats.balanceMinutes += userStat.balanceMinutes;
        stats.incidentCounts.vacation += userStat.incidents.vacation;
        stats.incidentCounts.sick += userStat.incidents.sick;
        stats.incidentCounts.absence += userStat.incidents.absence;
        stats.incidentCounts.other += userStat.incidents.other;

        stats.userStats.push(userStat);
    }

    return stats;
}
