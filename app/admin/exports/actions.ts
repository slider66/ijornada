"use server";

import { prisma } from "@/lib/prisma";
import { getDashboardStats as getStats, type DashboardStats } from "@/lib/stats";

export type { DashboardStats };

export async function getDashboardStats(
    from: Date,
    to: Date,
    userId?: string
): Promise<DashboardStats> {
    return getStats(from, to, userId);
}

export async function resetData(from?: Date, to?: Date) {
    try {
        const whereClause = from && to ? {
            timestamp: { gte: from, lte: to }
        } : {};

        const incidentWhere = from && to ? {
            startDate: { gte: from, lte: to }
        } : {};

        // Delete clock-ins and incidents based on range or all
        await prisma.clockIn.deleteMany({ where: whereClause });
        await prisma.incident.deleteMany({ where: incidentWhere });

        return { success: true };
    } catch (error) {
        console.error("Error resetting data:", error);
        return { success: false, error: "Failed to reset data" };
    }
}
