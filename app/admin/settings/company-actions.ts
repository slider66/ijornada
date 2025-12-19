"use server";

import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export interface CompanyInfoData {
    name: string;
    cif?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    phone?: string;
    email?: string;
    logoPath?: string;
}

export async function getCompanyInfo(): Promise<CompanyInfoData | null> {
    try {
        // Get the first (and should be only) company info record
        const companyInfo = await prisma.companyInfo.findFirst();

        if (!companyInfo) {
            return null;
        }

        return {
            name: companyInfo.name,
            cif: companyInfo.cif || undefined,
            address: companyInfo.address || undefined,
            postalCode: companyInfo.postalCode || undefined,
            city: companyInfo.city || undefined,
            phone: companyInfo.phone || undefined,
            email: companyInfo.email || undefined,
            logoPath: companyInfo.logoPath || undefined,
        };
    } catch (error) {
        console.error("Error fetching company info:", error);
        return null;
    }
}

export async function updateCompanyInfo(data: CompanyInfoData) {
    try {
        // Check if a company info record exists
        const existing = await prisma.companyInfo.findFirst();

        let result;
        if (existing) {
            // Update existing record
            result = await prisma.companyInfo.update({
                where: { id: existing.id },
                data: {
                    name: data.name,
                    cif: data.cif,
                    address: data.address,
                    postalCode: data.postalCode,
                    city: data.city,
                    phone: data.phone,
                    email: data.email,
                    logoPath: data.logoPath,
                },
            });
        } else {
            // Create new record
            result = await prisma.companyInfo.create({
                data: {
                    name: data.name,
                    cif: data.cif,
                    address: data.address,
                    postalCode: data.postalCode,
                    city: data.city,
                    phone: data.phone,
                    email: data.email,
                    logoPath: data.logoPath,
                },
            });
        }

        await logAction("COMPANY_INFO_UPDATE", `Company info updated: ${data.name}`, "ADMIN");

        return { success: true, data: result };
    } catch (error) {
        console.error("Error updating company info:", error);
        return { success: false, error: "Failed to update company info" };
    }
}
