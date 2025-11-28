"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Save } from "lucide-react"

type User = { id: string; name: string }
type Slot = { startTime: string; endTime: string }
type Schedule = { dayOfWeek: number; slots: Slot[] }

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function SchedulesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)

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
      // Map API data to state format
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
          applyToAll // Pass the flag
        }),
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const saveWeekToAll = async () => {
    if (selectedUser !== "GLOBAL") return
    if (!confirm("¿Estás seguro? Esto sobrescribirá los horarios de TODOS los trabajadores con la plantilla global.")) return
    
    setLoading(true)
    try {
      // We send a dummy schedule just to trigger the flag, or create a specific endpoint. 
      // Reusing POST with a flag is easiest.
      await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "GLOBAL",
          dayOfWeek: 0, // Dummy
          slots: [], // Dummy
          applyWeekToAll: true 
        }),
      })
      alert("Horario global aplicado a todos los trabajadores.")
    } catch (error) {
      console.error(error)
      alert("Error al aplicar horario.")
    } finally {
      setLoading(false)
    }
  }

  const copySchedule = (fromDayIndex: number, toDayIndex: number | 'all') => {
    const sourceSlots = schedules[fromDayIndex].slots.map(s => ({ ...s })) // Deep copy
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
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Horarios</h1>

      <div className="max-w-md">
        <Label>Seleccionar Trabajador</Label>
        <Select onValueChange={setSelectedUser}>
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

      {selectedUser && (
        <div className="grid gap-6">
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
          {schedules.map((schedule, dayIndex) => (
            // Skip Sunday/Saturday if desired, or keep all
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
    </div>
  )
}
