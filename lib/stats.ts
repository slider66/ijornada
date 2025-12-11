
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, isSameDay, differenceInMinutes, format } from "date-fns";
import { es } from "date-fns/locale";

export type DashboardStats = {
    totalUsers: number;
    totalWorkedMinutes: number;
    totalExpectedMinutes: number;
    totalExpectedToDateMinutes: number;
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
    expectedToDateMinutes: number;
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
    intervals: { start: string, end: string }[];
};

export async function getDashboardStats(
    from: Date,
    to: Date,
    userId?: string
): Promise<DashboardStats> {
    const startDate = startOfDay(from);
    const endDate = endOfDay(to);

    // Fetch System Config
    const config = await prisma.systemConfig.findMany({
        where: { key: { in: ["PILOT_START_DATE", "PRODUCTION_START_DATE"] } }
    });

    const configMap = config.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

    const pilotStart = configMap["PILOT_START_DATE"];
    const prodStart = configMap["PRODUCTION_START_DATE"];

    // Determine effective start date
    let effectiveStartDate = startDate;
    let prodDate: Date | null = null;
    const now = new Date();

    if (prodStart) {
        prodDate = startOfDay(new Date(prodStart));
        // Only use production date if it's in the past or today (active)
        // OR if there is no pilot date
        if (prodDate <= endOfDay(now)) {
            if (prodDate > effectiveStartDate) effectiveStartDate = prodDate;
        } else if (pilotStart) {
            // Production is in future, fall back to Pilot
            const pilotDate = startOfDay(new Date(pilotStart));
            if (pilotDate > effectiveStartDate) effectiveStartDate = pilotDate;
        } else {
            // Production in future, no pilot -> use prod date (stats will be empty)
            if (prodDate > effectiveStartDate) effectiveStartDate = prodDate;
        }
    } else if (pilotStart) {
        const pilotDate = startOfDay(new Date(pilotStart));
        if (pilotDate > effectiveStartDate) effectiveStartDate = pilotDate;
    }

    // If the effective start date is after the end date, return empty stats
    if (effectiveStartDate > endDate) {
        return {
            totalUsers: 0,
            totalWorkedMinutes: 0,
            totalExpectedMinutes: 0,
            totalExpectedToDateMinutes: 0,
            balanceMinutes: 0,
            incidentCounts: { vacation: 0, sick: 0, absence: 0, other: 0 },
            userStats: [],
        };
    }

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
            timestamp: { gte: effectiveStartDate, lte: endDate },
            userId: userId && userId !== "all" ? userId : undefined,
        },
        orderBy: { timestamp: "asc" },
    });

    const incidents = await prisma.incident.findMany({
        where: {
            startDate: { lte: endDate },
            endDate: { gte: effectiveStartDate }, // Overlapping range
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
        totalExpectedToDateMinutes: 0,
        balanceMinutes: 0,
        incidentCounts: { vacation: 0, sick: 0, absence: 0, other: 0 },
        userStats: [],
    };

    const daysInRange = eachDayOfInterval({ start: effectiveStartDate, end: endDate });


    for (const user of users) {
        const userStat: UserStat = {
            userId: user.id,
            userName: user.name,
            workedMinutes: 0,
            expectedMinutes: 0,
            expectedToDateMinutes: 0,
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (i: any) =>
                    i.userId === user.id &&
                    i.startDate <= endOfDay(day) &&
                    (i.endDate ? i.endDate >= startOfDay(day) : true)
            );

            // 2. Check Holidays
            const isHoliday = holidays.some((h) => isSameDay(h.date, day));

            // 3. Calculate Expected Minutes
            let expectedMinutes = 0;
            const isPilotDay = !prodDate || day < prodDate;

            // Only expect hours if no incident and no holiday (calculate even in pilot)
            if (!activeIncident && !isHoliday) {
                const schedule = user.schedules.find((s) => s.dayOfWeek === dayOfWeek);
                if (schedule) {
                    for (const slot of schedule.slots) {
                        const [startH, startM] = slot.startTime.split(":").map(Number);
                        const [endH, endM] = slot.endTime.split(":").map(Number);
                        expectedMinutes += (endH * 60 + endM) - (startH * 60 + startM);
                    }
                }
            } else if (isHoliday) {
                // Explicitly 0 for holidays (already handled by default 0, but good for clarity)
                expectedMinutes = 0;
            }

            // 4. Calculate Worked Minutes
            let workedMinutes = 0;
            const userDayClockIns = clockIns.filter(
                (c) => c.userId === user.id && isSameDay(c.timestamp, day)
            );

            const intervals: { start: string, end: string }[] = [];

            // Simple pair logic: IN -> OUT
            // If odd number, ignore last IN or assume ongoing (for now ignore)
            for (let i = 0; i < userDayClockIns.length; i += 2) {
                const start = userDayClockIns[i];
                const end = userDayClockIns[i + 1];
                if (start && start.type === "IN" && end && end.type === "OUT") {
                    workedMinutes += differenceInMinutes(end.timestamp, start.timestamp);
                    intervals.push({
                        start: format(start.timestamp, "HH:mm"),
                        end: format(end.timestamp, "HH:mm")
                    });
                }
            }

            // Update User Totals
            userStat.workedMinutes += workedMinutes;
            userStat.expectedMinutes += expectedMinutes;

            // Only add to "Expected To Date" if the day is in the past or today
            if (day <= endOfDay(now)) {
                userStat.expectedToDateMinutes += expectedMinutes;
            }

            // Update Incident Counts
            if (activeIncident) {
                const type = activeIncident.type.toLowerCase();
                if (type.includes("vacaci")) userStat.incidents.vacation++;
                else if (type.includes("baja") || type.includes("enfermedad") || type.includes("accidente")) userStat.incidents.sick++;
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

            // Update Balance (Accumulate only if NOT Pilot)
            // Even though we show expected/worked for Pilot, the Balance (Debt) only accumulates in Production.
            if (!isPilotDay) {
                userStat.balanceMinutes += (workedMinutes - expectedMinutes);
            }

            userStat.dailyBreakdown?.push({
                date: dateStr,
                dayName: format(day, "EEEE", { locale: es }),
                workedMinutes,
                expectedMinutes,
                balanceMinutes: workedMinutes - expectedMinutes, // Show theoretical balance for day // Show theoretical balance for day
                status,
                incidentType: activeIncident?.type,
                intervals
            });
        }

        // Add to Global Stats
        stats.totalWorkedMinutes += userStat.workedMinutes;
        stats.totalExpectedMinutes += userStat.expectedMinutes;
        stats.totalExpectedToDateMinutes += userStat.expectedToDateMinutes;
        stats.balanceMinutes += userStat.balanceMinutes;
        stats.incidentCounts.vacation += userStat.incidents.vacation;
        stats.incidentCounts.sick += userStat.incidents.sick;
        stats.incidentCounts.absence += userStat.incidents.absence;
        stats.incidentCounts.other += userStat.incidents.other;

        stats.userStats.push(userStat);
    }

    return stats;
}
