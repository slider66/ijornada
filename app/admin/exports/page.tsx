"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar as CalendarIcon, Users, Clock, AlertTriangle, Trash2, FileText, Mail } from "lucide-react";
import { getDashboardStats, type DashboardStats } from "./actions";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [userId, setUserId] = useState("all");
  const [users, setUsers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; cif?: string; address?: string; city?: string; phone?: string; email?: string; logoPath?: string } | null>(null);

  useEffect(() => {
    // Fetch users for filter
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));

    // Fetch company info
    fetch("/api/company-info")
      .then((res) => res.json())
      .then((data) => setCompanyInfo(data))
      .catch(() => setCompanyInfo(null));
  }, []);

  useEffect(() => {
    loadStats();
  }, [period, userId]);

  const loadStats = async () => {
    setLoading(true);
    const { from, to } = getDateRange();

    try {
      const data = await getDashboardStats(from, to, userId);
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let from = startOfMonth(now);
    let to = endOfMonth(now);

    if (period === "week") {
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
    } else if (period === "year") {
      from = startOfYear(now);
      to = endOfYear(now);
    } else if (period === "last_month") {
      const last = subMonths(now, 1);
      from = startOfMonth(last);
      to = endOfMonth(last);
    }
    return { from, to };
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? "-" : "";
    return `${sign}${h}h ${m}m`;
  };

  const handleExport = (type: "kpi" | "detail") => {
    const { from, to } = getDateRange();
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      userId: userId,
      type: type
    });
    window.location.href = `/api/export?${params.toString()}`;
  };

  const handlePDF = () => {
    if (!stats) return;
    const doc = new jsPDF();
    const { from, to } = getDateRange();
    const periodStr = `${format(from, "dd/MM/yyyy")} - ${format(to, "dd/MM/yyyy")}`;

    stats.userStats.forEach((user, index) => {
      if (index > 0) doc.addPage();

      let yPosition = 20;

      // Add company logo if available
      if (companyInfo?.logoPath) {
        try {
          doc.addImage(companyInfo.logoPath, 'PNG', 14, yPosition, 30, 30);
          yPosition += 35;
        } catch (e) {
          // If logo fails to load, just continue without it
          console.error("Failed to add logo to PDF:", e);
        }
      }

      // Company info header
      if (companyInfo?.name) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name, 14, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyInfo.cif) {
          doc.text(`CIF: ${companyInfo.cif}`, 14, yPosition);
          yPosition += 5;
        }
        if (companyInfo.address) {
          doc.text(companyInfo.address, 14, yPosition);
          yPosition += 5;
        }
        if (companyInfo.city || companyInfo.phone) {
          const cityPhone = [companyInfo.city, companyInfo.phone].filter(Boolean).join(' | ');
          doc.text(cityPhone, 14, yPosition);
          yPosition += 5;
        }
        yPosition += 5;
      }

      // Document title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Registro de Jornada: ${user.userName}`, 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periodo: ${periodStr}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Total Trabajado: ${formatDuration(user.workedMinutes)}`, 14, yPosition);
      yPosition += 10;

      const rows = user.dailyBreakdown?.map(day => [
        day.date,
        day.dayName,
        day.intervals.map(i => `${i.start}-${i.end}`).join(" | ") || (day.status !== "ok" && day.status !== "missing" ? day.status : ""),
        formatDuration(day.workedMinutes)
      ]) || [];

      autoTable(doc, {
        startY: yPosition,
        head: [['Fecha', 'Día', 'Entrada / Salida', 'Total']],
        body: rows,
      });

      const finalY = (doc as any).lastAutoTable.finalY + 40;
      doc.text("Firma del Trabajador:", 14, finalY);
      doc.line(50, finalY, 150, finalY); // Signature line
    });

    doc.save(`reporte-jornada-${userId}.pdf`);
  };

  const handleEmail = () => {
    if (userId === "all") {
      toast.error("Selecciona un trabajador específico para enviar email.");
      return;
    }
    const user = users.find(u => u.id === userId);
    if (!user || !user.email) {
      toast.error("El trabajador no tiene email configurado.");
      return;
    }

    const { from, to } = getDateRange();
    const subject = `Registro de Jornada ${format(from, "dd/MM")}-${format(to, "dd/MM")}`;
    const body = `Hola ${user.name},\n\nAdjunto encontrarás el registro de tu jornada. Por favor, revísalo y fírmalo.\n\nGracias.`;

    window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.info("Se ha abierto tu cliente de correo. Recuerda ADJUNTAR el PDF manualmente.");
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Panel de Análisis</h1>
        <div className="flex flex-wrap gap-2 items-center">

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="last_month">Mes Pasado</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
            </SelectContent>
          </Select>

          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-[200px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Trabajador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los trabajadores</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('kpi')} title="Descargar análisis de equipo">
              <Download className="mr-2 h-4 w-4" /> KPIs
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('detail')} title="Descargar registro detallado para firma">
              <FileText className="mr-2 h-4 w-4" /> Registro
            </Button>
            <Button variant="outline" size="sm" onClick={handlePDF} title="Generar PDF para imprimir y firmar">
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail} disabled={userId === 'all'} title="Enviar email al trabajador">
              <Mail className="mr-2 h-4 w-4" /> Email
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando datos...</div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(stats.totalWorkedMinutes)}</div>
                <p className="text-xs text-muted-foreground">
                  Esperado: {formatDuration(stats.totalExpectedMinutes)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stats.balanceMinutes < 0 ? "Horas Restantes" : "Horas Extra"}
                </CardTitle>
                <Clock className={cn("h-4 w-4", stats.balanceMinutes >= 0 ? "text-green-500" : "text-blue-500")} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", stats.balanceMinutes >= 0 ? "text-green-600" : "text-blue-600")}>
                  {formatDuration(Math.abs(stats.balanceMinutes))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.balanceMinutes >= 0 ? "Por encima del objetivo" : "Para cumplir el objetivo"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absentismo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.incidentCounts.absence}</div>
                <p className="text-xs text-muted-foreground">Faltas injustificadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bajas / Vacaciones</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.incidentCounts.sick + stats.incidentCounts.vacation}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.incidentCounts.sick} Bajas, {stats.incidentCounts.vacation} Vacaciones
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose por Trabajador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b">
                    <tr>
                      <th className="px-4 py-3">Trabajador</th>
                      <th className="px-4 py-3">Trabajado</th>
                      <th className="px-4 py-3">Esperado</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Incidencias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.userStats.map((user) => (
                      <tr key={user.userId} className="border-b hover:bg-zinc-50/50">
                        <td className="px-4 py-3 font-medium">{user.userName}</td>
                        <td className="px-4 py-3">{formatDuration(user.workedMinutes)}</td>
                        <td className="px-4 py-3 text-zinc-500">{formatDuration(user.expectedMinutes)}</td>
                        <td className={cn("px-4 py-3 font-bold", user.balanceMinutes >= 0 ? "text-green-600" : "text-red-600")}>
                          {formatDuration(user.balanceMinutes)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 text-xs">
                            {user.incidents.vacation > 0 && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {user.incidents.vacation} Vac
                              </span>
                            )}
                            {user.incidents.sick > 0 && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                {user.incidents.sick} Baj
                              </span>
                            )}
                            {user.incidents.absence > 0 && (
                              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                {user.incidents.absence} Fal
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown (Only if single user selected) */}
          {userId !== "all" && stats.userStats[0]?.dailyBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle Diario: {stats.userStats[0].userName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Día</th>
                        <th className="px-4 py-3">Entrada / Salida</th>
                        <th className="px-4 py-3">Trabajado</th>
                        <th className="px-4 py-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.userStats[0].dailyBreakdown.map((day) => (
                        <tr key={day.date} className="border-b hover:bg-zinc-50/50">
                          <td className="px-4 py-3">{day.date}</td>
                          <td className="px-4 py-3 capitalize">{day.dayName}</td>
                          <td className="px-4 py-3 text-zinc-700">
                            {day.intervals.map((i, idx) => (
                              <span key={idx} className="block">{i.start} - {i.end}</span>
                            ))}
                            {day.intervals.length === 0 && (
                              <>
                                {day.status === "incident" ? (
                                  <span className="text-orange-600 font-medium">{day.incidentType}</span>
                                ) : day.status === "holiday" ? (
                                  <span className="text-blue-600 font-medium">Festivo</span>
                                ) : day.status === "missing" ? (
                                  <span className="text-red-600 font-medium">Falta asistencia</span>
                                ) : day.status === "off" ? (
                                  <span className="text-zinc-400">Libre</span>
                                ) : null}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3">{formatDuration(day.workedMinutes)}</td>
                          <td className={cn("px-4 py-3", day.balanceMinutes >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatDuration(day.balanceMinutes)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}



    </div>
  );
}
