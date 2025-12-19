import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/app/admin/settings/company-actions";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const companyInfo = await getCompanyInfo();
        return NextResponse.json(companyInfo || {});
    } catch (error) {
        console.error("Error fetching company info:", error);
        return NextResponse.json({}, { status: 500 });
    }
}
