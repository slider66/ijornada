"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";

export async function getSystemConfig() {
  const config = await prisma.systemConfig.findMany();
  return config.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateSystemConfig(key: string, value: string) {
  try {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    await logAction("UPDATE_CONFIG", `Config ${key} updated to ${value}`, "ADMIN");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating config:", error);
    return { success: false, error: "Failed to update config" };
  }
}

import { hash } from "bcryptjs";

export async function upsertAdminUser(data: { name: string; email: string; password?: string }) {
  try {
    // Check if admin exists (by email, or we assume single admin concept? Plan said "create an admin user")
    // Let's rely on email as unique identifier for now, or finding by Role if we want to enforce single admin?
    // User requested "create AN admin user", implying potentially multiple or specific one.
    // We will use email to upsert.

    let updateData: any = {
      name: data.name,
      role: "ADMIN",
    };

    if (data.password) {
      updateData.password = await hash(data.password, 12);
    }

    await prisma.user.upsert({
      where: { email: data.email },
      update: updateData,
      create: {
        name: data.name,
        email: data.email,
        password: await hash(data.password || "admin123", 12), // Fallback if creating without password, though UI should enforce
        role: "ADMIN",
      },
    });

    await logAction("UPSERT_ADMIN", `Admin user ${data.email} upserted`, "ADMIN");

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Error upserting admin:", error);
    return { success: false, error: "Failed to save admin user" };
  }
}
