"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";
import { headers } from "next/headers";
import { getClosureForDate } from "@/app/admin/company-closures/actions";

export type PinVerificationResult = {
    success: boolean;
    message?: string;
    user?: {
        name: string;
    };
    type?: "IN" | "OUT";
    timestamp?: string;
    sound?: "success" | "enter_correct" | "exit_correct" | "error";
};

export async function verifyPin(pin: string): Promise<PinVerificationResult> {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";

    // Rate Limiting Check
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentFailures = await prisma.auditLog.count({
        where: {
            action: "PIN_FAIL",
            timestamp: { gte: oneMinuteAgo },
            details: { contains: `IP: ${ip}` }
        }
    });

    if (recentFailures >= 5) {
        return { success: false, message: "Demasiados intentos fallidos. Inténtalo más tarde.", sound: "error" };
    }

    if (!pin || pin.length < 4 || !/^\d+$/.test(pin)) {
        return { success: false, message: "PIN inválido. Debe tener al menos 4 dígitos.", sound: "error" };
    }

    try {
        // Check if today is a company closure day
        const today = new Date();
        const closure = await getClosureForDate(today);

        if (closure) {
            return {
                success: false,
                message: `La empresa está cerrada: ${closure.name} (${formatDate(closure.startDate)} - ${formatDate(closure.endDate)})`,
                sound: "error"
            };
        }

        const user = await prisma.user.findUnique({
            where: { pin },
            include: {
                clockIns: {
                    orderBy: { timestamp: "desc" },
                    take: 1,
                },
                schedules: {
                    include: { slots: true }
                }
            },
        });

        if (!user) {
            await logAction("PIN_FAIL", `Failed PIN attempt from IP: ${ip}`, "SYSTEM");
            return { success: false, message: "PIN no encontrado.", sound: "error" };
        }

        // Determine type based on last clock-in
        const lastClockIn = user.clockIns[0];
        const type = lastClockIn?.type === "IN" ? "OUT" : "IN";
        const now = new Date();

        // Check for specific audio feedback based on schedule
        let sound: "success" | "enter_correct" | "exit_correct" | "error" = "success";

        // Find schedule for today (0=Sunday, 1=Monday, etc.)
        const todayDay = now.getDay();
        const schedule = user.schedules.find(s => s.dayOfWeek === todayDay);

        if (schedule && schedule.slots.length > 0) {
            // Simple logic: Check if current time is within a reasonable window of any slot start (for IN) or end (for OUT)
            // Tolerance: +/- 60 minutes
            const toleranceMs = 60 * 60 * 1000;
            const currentTimeMs = now.getHours() * 3600000 + now.getMinutes() * 60000;

            const isCorrectEntry = schedule.slots.some(slot => {
                const [h, m] = slot.startTime.split(':').map(Number);
                const slotTimeMs = h * 3600000 + m * 60000;
                return Math.abs(currentTimeMs - slotTimeMs) <= toleranceMs;
            });

            const isCorrectExit = schedule.slots.some(slot => {
                const [h, m] = slot.endTime.split(':').map(Number);
                const slotTimeMs = h * 3600000 + m * 60000;
                return Math.abs(currentTimeMs - slotTimeMs) <= toleranceMs;
            });

            if (type === "IN" && isCorrectEntry) {
                sound = "enter_correct";
            } else if (type === "OUT" && isCorrectExit) {
                sound = "exit_correct";
            }
        } else {
            // If no schedule, default to specific sounds if valid
            if (type === "IN") sound = "enter_correct";
            if (type === "OUT") sound = "exit_correct";
        }

        // Create new clock-in record
        await prisma.clockIn.create({
            data: {
                userId: user.id,
                type,
                method: "PIN",
                timestamp: now,
            },
        });

        // Audit Log
        await logAction("CLOCK_IN_PIN", `User ${user.name} (${user.email || "No Email"}) clocked ${type} via PIN from IP: ${ip}`, user.id);

        revalidatePath("/admin");

        return {
            success: true,
            user: { name: user.name },
            type,
            timestamp: now.toLocaleTimeString(),
            sound
        };
    } catch (error) {
        console.error("Error verifying PIN:", error);
        return { success: false, message: "Error del sistema. Inténtalo de nuevo.", sound: "error" };
    }
}

export async function verifyQr(token: string): Promise<PinVerificationResult> {
    if (!token) {
        return { success: false, message: "Código QR inválido.", sound: "error" };
    }

    try {
        // Check if today is a company closure day
        const today = new Date();
        const closure = await getClosureForDate(today);

        if (closure) {
            return {
                success: false,
                message: `La empresa está cerrada: ${closure.name} (${formatDate(closure.startDate)} - ${formatDate(closure.endDate)})`,
                sound: "error"
            };
        }

        const user = await prisma.user.findUnique({
            where: { qrToken: token },
            include: {
                clockIns: {
                    orderBy: { timestamp: "desc" },
                    take: 1,
                },
                schedules: {
                    include: { slots: true }
                }
            },
        });

        if (!user) {
            return { success: false, message: "Código QR no reconocido.", sound: "error" };
        }

        // Determine type based on last clock-in
        const lastClockIn = user.clockIns[0];
        const type = lastClockIn?.type === "IN" ? "OUT" : "IN";
        const now = new Date();

        // Check for specific audio feedback based on schedule
        let sound: "success" | "enter_correct" | "exit_correct" | "error" = "success";

        // Find schedule for today (0=Sunday, 1=Monday, etc.)
        const todayDay = now.getDay();
        const schedule = user.schedules.find(s => s.dayOfWeek === todayDay);

        if (schedule && schedule.slots.length > 0) {
            const toleranceMs = 60 * 60 * 1000;
            const currentTimeMs = now.getHours() * 3600000 + now.getMinutes() * 60000;

            const isCorrectEntry = schedule.slots.some(slot => {
                const [h, m] = slot.startTime.split(':').map(Number);
                const slotTimeMs = h * 3600000 + m * 60000;
                return Math.abs(currentTimeMs - slotTimeMs) <= toleranceMs;
            });

            const isCorrectExit = schedule.slots.some(slot => {
                const [h, m] = slot.endTime.split(':').map(Number);
                const slotTimeMs = h * 3600000 + m * 60000;
                return Math.abs(currentTimeMs - slotTimeMs) <= toleranceMs;
            });

            if (type === "IN" && isCorrectEntry) {
                sound = "enter_correct";
            } else if (type === "OUT" && isCorrectExit) {
                sound = "exit_correct";
            }
        } else {
            if (type === "IN") sound = "enter_correct";
            if (type === "OUT") sound = "exit_correct";
        }

        // Create new clock-in record
        await prisma.clockIn.create({
            data: {
                userId: user.id,
                type,
                method: "QR",
                timestamp: now,
            },
        });

        // Audit Log
        await logAction("CLOCK_IN_QR", `User ${user.name} (${user.email || "No Email"}) clocked ${type} via QR`, user.id);

        revalidatePath("/admin");

        return {
            success: true,
            user: { name: user.name },
            type,
            timestamp: now.toLocaleTimeString(),
            sound
        };
    } catch (error) {
        console.error("Error verifying QR:", error);
        return { success: false, message: "Error del sistema. Inténtalo de nuevo.", sound: "error" };
    }
}

// Helper function to format dates
function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
    });
}
