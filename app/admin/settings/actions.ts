"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating config:", error);
    return { success: false, error: "Failed to update config" };
  }
}
