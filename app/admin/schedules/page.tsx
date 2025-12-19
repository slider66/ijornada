"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Save, Copy, Users, Clock } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

type User = { id: string; name: string }
type Slot = { startTime: string; endTime: string }
type Schedule = { dayOfWeek: number; slots: Slot[] }

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

// Plantillas predefinidas
const TEMPLATES = {
  jornadaCompleta: {
    name: "Jornada Completa (8h)",
    slots: [
      { startTime: "08:00", endTime: "13:00" },
      { startTime: "14:00", endTime: "17:00" }
    ]
  },
  mediaJornada: {
    name: "Media Jornada (4h)",
    slots: [{ startTime: "08:00", endTime: "12:00" }]
  },
  jornadaIntensiva: {
    name: "Intensiva (7h)",
    slots: [{ startTime: "08:00", endTime: "15:00" }]
  },
  turnoTarde: {
    name: "Turno Tarde (8h)",
    slots: [{ startTime: "14:00", endTime: "22:00" }]
  }
}

export default function SchedulesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact')

  // Nuevo: Estado para copiar de otro trabajador
  const [sourceUser, setSourceUser] = useState<string>("")

  // Nuevo: Estado para aplicar a múltiples trabajadores
  const [targetUsers, setTargetUsers] = useState<string[]>([])
  const [showApplyToOthers, setShowApplyToOthers] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) fetchSchedules(selectedUser)
  }, [selectedUser])

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    if (res.ok) setUsers(await res.json())
  }

  const fetchSchedules = async (userId: string) => {
    const res = await fetch(`/api/schedules?userId=${userId}`)
    if (res.ok) {
      const data = await res.json()
      const mapped = Array(7).fill(null).map((_, i) => {
        const existing = data.find((s: any) => s.dayOfWeek === i)
        return {
          dayOfWeek: i,
          slots: existing ? existing.slots.map((s: any) => ({ startTime: s.startTime, endTime: s.endTime })) : []
        }
      })
      setSchedules(mapped)
    }
  }

  // NUEVO: Copiar horario de otro trabajador
  const copyFromWorker = async () => {
    if (!sourceUser) {
      toast.error("Selecciona un trabajador")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/schedules?userId=${sourceUser}`)
      if (res.ok) {
        const data = await res.json()
        const mapped = Array(7).fill(null).map((_, i) => {
          const existing = data.find((s: any) => s.dayOfWeek === i)
          return {
            dayOfWeek: i,
            slots: existing ? existing.slots.map((s: any) => ({ startTime: s.startTime, endTime: s.endTime })) : []
          }
        })
        setSchedules(mapped)
        const sourceName = users.find(u => u.id === sourceUser)?.name
        toast.success(`Horario copiado de ${sourceName}`)
      }
    } catch (error) {
      toast.error("Error al copiar horario")
    } finally {
      setLoading(false)
    }
  }

  // NUEVO: Aplicar horario actual a múltiples trabajadores
  const applyToMultipleWorkers = async () => {
    if (targetUsers.length === 0) {
      toast.error("Selecciona al menos un trabajador")
      return
    }

    if (!confirm(`¿Aplicar este horario a ${targetUsers.length} trabajador(es)?`)) {
      return
    }

    setLoading(true)
    try {
      // Guardar para cada trabajador seleccionado
      for (const userId of targetUsers) {
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          await fetch("/api/schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userId,
              dayOfWeek: dayIndex,
              slots: schedules[dayIndex].slots,
            }),
          })
        }
      }
      toast.success(`Horario aplicado a ${targetUsers.length} trabajador(es)`)
      setTargetUsers([])
      setShowApplyToOthers(false)
    } catch (error) {
      toast.error("Error al aplicar horario")
    } finally {
      setLoading(false)
    }
  }

  // NUEVO: Aplicar plantilla
  const applyTemplate = (templateKey: keyof typeof TEMPLATES, target: 'today' | 'weekdays' | 'all') => {
    const template = TEMPLATES[templateKey]
    const newSchedules = [...schedules]

    if (target === 'all') {
      // Aplicar a todos los días
      newSchedules.forEach(day => {
        day.slots = template.slots.map(s => ({ ...s }))
      })
    } else if (target === 'weekdays') {
      // Aplicar solo a días laborables (1-5: Lun-Vie)
      newSchedules.forEach((day, index) => {
        if (index >= 1 && index <= 5) {
          day.slots = template.slots.map(s => ({ ...s }))
        }
      })
    }

    setSchedules(newSchedules)
    toast.success(`Plantilla "${template.name}" aplicada`)
  }

  // NUEVO: Calcular horas de un día
  const calculateDayHours = (slots: Slot[]): number => {
    let totalMinutes = 0
    slots.forEach(slot => {
      const [startH, startM] = slot.startTime.split(':').map(Number)
      const [endH, endM] = slot.endTime.split(':').map(Number)
      const start = startH * 60 + startM
      const end = endH * 60 + endM
      totalMinutes += (end - start)
    })
    return totalMinutes / 60
  }

  // NUEVO: Calcular total semanal
  const calculateWeeklyHours = (): number => {
    return schedules.reduce((total, day) => total + calculateDayHours(day.slots), 0)
  }

  // NUEVO: Guardar toda la semana
  const saveWeek = async () => {
    if (!selectedUser) return
    setLoading(true)

    try {
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser,
            dayOfWeek: dayIndex,
            slots: schedules[dayIndex].slots,
          }),
        })
      }
      toast.success("Semana completa guardada")
    } catch (error) {
      toast.error("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  const addSlot = (dayIndex: number) => {
    const newSchedules = [...schedules]
    newSchedules[dayIndex].slots.push({ startTime: "09:00", endTime: "17:00" })
    setSchedules(newSchedules)
  }

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedules = [...schedules]
    newSchedules[dayIndex].slots.splice(slotIndex, 1)
    setSchedules(newSchedules)
  }

  const updateSlot = (dayIndex: number, slotIndex: number, field: keyof Slot, value: string) => {
    const newSchedules = [...schedules]
    newSchedules[dayIndex].slots[slotIndex][field] = value
    setSchedules(newSchedules)
  }

  const saveSchedule = async (dayIndex: number, applyToAll = false) => {
    if (!selectedUser) return
    setLoading(true)
    try {
      await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          dayOfWeek: dayIndex,
          slots: schedules[dayIndex].slots,
          applyToAll
        }),
      })
      toast.success("Guardado")
    } catch (error) {
      toast.error("Error")
    } finally {
      setLoading(false)
    }
  }

  const saveWeekToAll = async () => {
    if (selectedUser !== "GLOBAL") return
    if (!confirm("¿Estás seguro? Esto sobrescribirá los horarios de TODOS los trabajadores con la plantilla global.")) return

    setLoading(true)
    try {
      await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "GLOBAL",
          dayOfWeek: 0,
          slots: [],
          applyWeekToAll: true
        }),
      })
      toast.success("Horario global aplicado a todos")
    } catch (error) {
      toast.error("Error al aplicar horario")
    } finally {
      setLoading(false)
    }
  }

  const copySchedule = (fromDayIndex: number, toDayIndex: number | 'all') => {
    const sourceSlots = schedules[fromDayIndex].slots.map(s => ({ ...s }))
    const newSchedules = [...schedules]

    if (toDayIndex === 'all') {
      newSchedules.forEach((day, index) => {
        if (index !== fromDayIndex) {
          day.slots = sourceSlots.map(s => ({ ...s }))
        }
      })
    } else {
      newSchedules[toDayIndex].slots = sourceSlots
    }
    setSchedules(newSchedules)
    toast.success("Horario copiado")
  }

  const weeklyHours = calculateWeeklyHours()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Horarios</h1>

      <div className="max-w-md">
        <Label>Seleccionar Trabajador</Label>
        <Select onValueChange={setSelectedUser} value={selectedUser}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GLOBAL" className="font-bold border-b">Plantilla Global (Todos)</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUser && selectedUser !== "GLOBAL" && (
        <>
          {/* NUEVO: Copiar desde otro trabajador */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copiar Horario de Otro Trabajador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Select onValueChange={setSourceUser} value={sourceUser}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar trabajador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.id !== selectedUser).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={copyFromWorker} disabled={!sourceUser || loading}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Horario Completo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NUEVO: Aplicar a otros trabajadores */}
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Aplicar Este Horario a Otros Trabajadores
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApplyToOthers(!showApplyToOthers)}
                >
                  {showApplyToOthers ? "Ocultar" : "Mostrar"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showApplyToOthers && (
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {users.filter(u => u.id !== selectedUser).map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={user.id}
                          checked={targetUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTargetUsers([...targetUsers, user.id])
                            } else {
                              setTargetUsers(targetUsers.filter(id => id !== user.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={user.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {user.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={applyToMultipleWorkers}
                    disabled={targetUsers.length === 0 || loading}
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Aplicar a {targetUsers.length} Trabajador(es) Seleccionado(s)
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}

      {selectedUser && (
        <>
          {/* NUEVO: Plantillas rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">📋 Plantillas Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(TEMPLATES).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(key as keyof typeof TEMPLATES, 'weekdays')}
                      disabled={loading}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>Aplicar a:</span>
                  <Button size="sm" variant="ghost" className="h-6 px-2">Lun-Vie</Button>
                  <span className="text-xs">(Por defecto)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NUEVO: Toggle vista */}
          <div className="flex items-center justify-between">
            <Label>Vista:</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                onClick={() => setViewMode('compact')}
              >
                Compacta
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                onClick={() => setViewMode('detailed')}
              >
                Detallada
              </Button>
            </div>
          </div>

          {selectedUser === "GLOBAL" && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800 text-sm mb-4 flex justify-between items-center">
              <div>
                <strong>Modo Plantilla Global:</strong> Los cambios aquí no afectan automáticamente a los usuarios a menos que uses "Aplicar a todos".
              </div>
              <Button size="sm" onClick={() => saveWeekToAll()} disabled={loading}>
                Aplicar Semana Completa a Todos
              </Button>
            </div>
          )}

          {/* Vista Compacta */}
          {viewMode === 'compact' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horario Semanal
                  </CardTitle>
                  <div className="text-sm font-semibold">
                    Total: {weeklyHours.toFixed(1)}h
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Día</th>
                        <th className="text-left p-2 font-semibold">Turno 1</th>
                        <th className="text-left p-2 font-semibold">Turno 2</th>
                        <th className="text-right p-2 font-semibold">Horas</th>
                        <th className="text-right p-2 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((schedule, dayIndex) => {
                        const dayHours = calculateDayHours(schedule.slots)
                        return (
                          <tr key={dayIndex} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{DAYS_SHORT[dayIndex]}</td>
                            <td className="p-2">
                              {schedule.slots[0] ? (
                                <span className="text-sm">{schedule.slots[0].startTime} - {schedule.slots[0].endTime}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">---</span>
                              )}
                            </td>
                            <td className="p-2">
                              {schedule.slots[1] ? (
                                <span className="text-sm">{schedule.slots[1].startTime} - {schedule.slots[1].endTime}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">---</span>
                              )}
                            </td>
                            <td className="p-2 text-right font-mono">
                              <span className={dayHours === 0 ? "text-muted-foreground" : "font-semibold"}>
                                {dayHours.toFixed(1)}h
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setViewMode('detailed')
                                    // Scroll to that day
                                  }}
                                  title="Editar"
                                >
                                  ✏️
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveWeek} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Toda la Semana
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vista Detallada (Original) */}
          {viewMode === 'detailed' && (
            <div className="grid gap-6">
              {schedules.map((schedule, dayIndex) => (
                <Card key={dayIndex} className={selectedUser === "GLOBAL" ? "border-blue-200" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg">{DAYS[dayIndex]}</CardTitle>
                    <div className="flex gap-2">
                      <Select onValueChange={(v) => copySchedule(dayIndex, v === 'all' ? 'all' : parseInt(v))}>
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue placeholder="Copiar a..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los días</SelectItem>
                          {DAYS.map((d, i) => (
                            i !== dayIndex && <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => addSlot(dayIndex)}>
                        <Plus className="h-4 w-4 mr-1" /> Añadir Tramo
                      </Button>
                      <Button size="sm" onClick={() => saveSchedule(dayIndex)} disabled={loading}>
                        <Save className="h-4 w-4 mr-1" /> Guardar
                      </Button>
                      {selectedUser === "GLOBAL" && (
                        <Button size="sm" variant="secondary" onClick={() => saveSchedule(dayIndex, true)} disabled={loading} title="Aplicar a todos los trabajadores">
                          Aplicar a Todos
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {schedule.slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Sin horario asignado</p>
                    ) : (
                      <div className="space-y-3">
                        {schedule.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-3">
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSlot(dayIndex, slotIndex, "startTime", e.target.value)}
                              className="w-32"
                            />
                            <span>a</span>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSlot(dayIndex, slotIndex, "endTime", e.target.value)}
                              className="w-32"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeSlot(dayIndex, slotIndex)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
