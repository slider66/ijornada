import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type OpenHoliday = {
  startDate: string;
  name: { text: string }[];
  regionalScope: string;
};

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    
    // Try to fetch holidays from DB for the current year
    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfYear = new Date(`${currentYear}-12-31`);
    
    let holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      orderBy: { date: 'asc' }
    });

    // If no holidays found for current year, fetch from API and seed
    if (holidays.length === 0) {

      
      const response = await fetch(
        `https://openholidaysapi.org/PublicHolidays?countryIsoCode=ES&languageIsoCode=ES&validFrom=${currentYear}-01-01&validTo=${currentYear}-12-31&subdivisionCode=ES-MD`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from API: ${response.statusText}`);
      }

      const apiHolidays: OpenHoliday[] = await response.json();

      const holidaysToCreate = apiHolidays.map((h) => ({
        date: new Date(h.startDate),
        name: h.name[0].text,
        type: h.regionalScope === "National" ? "NATIONAL" : "REGIONAL",
        region: "Madrid"
      }));

      if (holidaysToCreate.length > 0) {
        await prisma.holiday.createMany({
          data: holidaysToCreate,
        });
      }

      holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: startOfYear,
            lte: endOfYear
          }
        },
        orderBy: { date: 'asc' }
      });
    }

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, name, type, region } = body;

    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        name,
        type,
        region: region || "Madrid",
      },
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}
