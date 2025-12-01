"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar as CalendarIcon, Users, Clock, AlertTriangle } from "lucide-react";
import { getDashboardStats, type DashboardStats } from "./actions";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ExportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [userId, setUserId] = useState("all");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch users for filter
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  useEffect(() => {
    loadStats();
  }, [period, userId]);

  const loadStats = async () => {
    setLoading(true);
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

    try {
      const data = await getDashboardStats(from, to, userId);
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? "-" : "";
    return `${sign}${h}h ${m}m`;
  };

  const handleExport = () => {
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

    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      userId: userId
    });

    window.location.href = `/api/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Panel de Análisis</h1>
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
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
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <Clock className={cn("h-4 w-4", stats.balanceMinutes >= 0 ? "text-green-500" : "text-red-500")} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", stats.balanceMinutes >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatDuration(stats.balanceMinutes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.balanceMinutes >= 0 ? "Horas extra" : "Horas debidas"}
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
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Trabajado</th>
                        <th className="px-4 py-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.userStats[0].dailyBreakdown.map((day) => (
                        <tr key={day.date} className="border-b hover:bg-zinc-50/50">
                          <td className="px-4 py-3">{day.date}</td>
                          <td className="px-4 py-3 capitalize">{day.dayName}</td>
                          <td className="px-4 py-3">
                            {day.status === "incident" ? (
                              <span className="text-orange-600 font-medium">{day.incidentType}</span>
                            ) : day.status === "holiday" ? (
                              <span className="text-blue-600 font-medium">Festivo</span>
                            ) : day.status === "missing" ? (
                              <span className="text-red-600 font-medium">Falta horas</span>
                            ) : day.status === "extra" ? (
                              <span className="text-green-600 font-medium">Extra</span>
                            ) : day.status === "off" ? (
                              <span className="text-zinc-400">Libre</span>
                            ) : (
                              <span className="text-zinc-600">Correcto</span>
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
