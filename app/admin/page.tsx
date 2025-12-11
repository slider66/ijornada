import { getAdminDashboardStats } from "./actions";
import { LiveClock } from "@/components/live-clock";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Palmtree } from "lucide-react";

export default async function AdminPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <LiveClock />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Trabajadores Activos</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.activeWorkers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Fichajes Hoy</h3>
          <p className="text-4xl font-bold text-green-600">{stats.fichajesToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Incidencias Pendientes</h3>
          <p className="text-4xl font-bold text-orange-600">{stats.pendingIncidents}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos (15 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay festivos ni vacaciones próximas.</p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {event.type === "holiday" ? (
                        <CalendarDays className="h-5 w-5 text-red-500" />
                      ) : (
                        <Palmtree className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {format(event.date, "EEEE, d 'de' MMMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

