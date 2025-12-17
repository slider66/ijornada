"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit";

export async function getHolidays() {
  return await prisma.holiday.findMany({
    orderBy: { date: "asc" },
  });
}

export async function createHoliday(date: Date, name: string) {
  try {
    await prisma.holiday.create({
      data: {
        date,
        name,
        type: "NATIONAL", // Default for now
      },
    });
    revalidatePath("/admin/holidays");
    return { success: true };
  } catch (error) {
    console.error("Error creating holiday:", error);
    return { success: false, error: "Failed to create holiday" };
  }
}

export async function deleteHoliday(id: string) {
  try {
    await prisma.holiday.delete({
      where: { id },
    });
    await logAction("DELETE_HOLIDAY", `Holiday ${id} deleted`);
    revalidatePath("/admin/holidays");
    return { success: true };
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return { success: false, error: "Failed to delete holiday" };
  }
}

export async function importHolidays(holidays: { date: Date; name: string }[]) {
  try {
    await prisma.holiday.createMany({
      data: holidays.map((h) => ({
        date: h.date,
        name: h.name,
        type: "NATIONAL",
      })),
    });
    revalidatePath("/admin/holidays");
    return { success: true, count: holidays.length };
  } catch (error) {
    console.error("Error importing holidays:", error);
    return { success: false, error: "Failed to import holidays" };
  }
}
