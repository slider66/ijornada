import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/stats"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fromStr = searchParams.get("from")
  const toStr = searchParams.get("to")
  const userId = searchParams.get("userId") || undefined
  const type = searchParams.get("type") || "detail" // 'kpi' or 'detail'

  if (!fromStr || !toStr) {
    return new NextResponse("Missing dates", { status: 400 })
  }

  const from = new Date(fromStr)
  const to = new Date(toStr)

  const stats = await getDashboardStats(from, to, userId)
  const bom = "\uFEFF";
  let csvContent = bom;

  if (type === "kpi") {
    // KPI Export
    csvContent += "Trabajador,Horas Trabajadas,Horas Esperadas,Balance Minutos,Cumplimiento %,Incidencias Total,Faltas,MVP Score\n"

    for (const user of stats.userStats) {
      const compliance = user.expectedMinutes > 0 ? ((user.workedMinutes / user.expectedMinutes) * 100).toFixed(1) : "0.0";
      const incidentsTotal = user.incidents.sick + user.incidents.vacation + user.incidents.absence + user.incidents.other;

      // Simple Score: Balance - (Faltas * 480)
      const score = user.balanceMinutes - (user.incidents.absence * 480);

      csvContent += `"${user.userName}",${formatDuration(user.workedMinutes)},${formatDuration(user.expectedMinutes)},${user.balanceMinutes},${compliance}%,${incidentsTotal},${user.incidents.absence},${score}\n`
    }

  } else {
    // Detailed Export (Daily Log)
    csvContent += "Trabajador,ID,Fecha,Dia,Entrada / Salida,Total Trabajado\n"

    for (const user of stats.userStats) {
      if (user.dailyBreakdown) {
        for (const day of user.dailyBreakdown) {
          const intervalsStr = day.intervals.map(i => `${i.start}-${i.end}`).join(" | ");
          // If no intervals but not empty (e.g. sick), maybe show status?
          const displayTime = intervalsStr || (day.status !== "ok" && day.status !== "missing" ? day.status : "");

          csvContent += `"${user.userName}",${user.userId},${day.date},${day.dayName},"${displayTime}",${formatDuration(day.workedMinutes)}\n`
        }
      }
    }

    // Add Signature Footer
    csvContent += "\n\n\nFirma del Trabajador: ____________________________________\n"
  }

  const filename = `export-${type}-${format(new Date(), "yyyy-MM-dd")}.csv`

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

function formatDuration(minutes: number) {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${h}h ${m}m`;
}
