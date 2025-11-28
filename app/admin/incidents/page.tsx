"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

type User = { id: string; name: string }
type Incident = {
  id: string
  user: User
  type: string
  startDate: string
  endDate: string | null
  status: string
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ 
    userId: "", 
    type: "BAJA", 
    startDate: "", 
    endDate: "",
    description: "" 
  })

  useEffect(() => {
    fetchIncidents()
    fetchUsers()
  }, [])

  const fetchIncidents = async () => {
    const res = await fetch("/api/incidents")
    if (res.ok) setIncidents(await res.json())
  }

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    if (res.ok) setUsers(await res.json())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    setIsCreating(false)
    setFormData({ userId: "", type: "BAJA", startDate: "", endDate: "", description: "" })
    fetchIncidents()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Bajas y Faltas</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Incidencia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trabajador</Label>
                  <Select onValueChange={v => setFormData({...formData, userId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select defaultValue="BAJA" onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAJA">Baja Médica</SelectItem>
                      <SelectItem value="FALTA">Falta Injustificada</SelectItem>
                      <SelectItem value="VACACIONES">Vacaciones</SelectItem>
                      <SelectItem value="PERMISO">Permiso Retribuido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input 
                    type="date"
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin (Opcional)</Label>
                  <Input 
                    type="date"
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {incidents.map(inc => (
          <Card key={inc.id}>
            <CardContent className="flex justify-between items-center p-6">
              <div>
                <h3 className="font-bold text-lg">{inc.user.name}</h3>
                <p className="text-sm font-medium text-blue-600">{inc.type}</p>
                <p className="text-sm text-muted-foreground">
                  Desde: {new Date(inc.startDate).toLocaleDateString()} 
                  {inc.endDate && ` - Hasta: ${new Date(inc.endDate).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
                  {inc.status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
