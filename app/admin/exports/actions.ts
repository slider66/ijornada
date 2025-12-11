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

export async function resetData() {
    try {
        // Delete all clock-ins and incidents
        await prisma.clockIn.deleteMany({});
        await prisma.incident.deleteMany({});
        return { success: true };
    } catch (error) {
        console.error("Error resetting data:", error);
        return { success: false, error: "Failed to reset data" };
    }
}
