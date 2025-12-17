import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function logAction(action: string, details: string, userId?: string) {
    try {
        // Attempt to get current user if not provided
        const session = await auth();
        const actorId = userId || session?.user?.id || null;

        // Use specific "SYSTEM" or fallback if no user
        // Note: The schema allows userId to be nullable.

        await prisma.auditLog.create({
            data: {
                action,
                details,
                userId: actorId, // nullable
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Silent fail to not break the main flow, or throw depending on strictness.
        // robust systems might queue this.
    }
}
