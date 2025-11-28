"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  nfcTagId: string | null
  pin: string | null
  role: string
}

export default function WorkersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", nfcTagId: "", pin: "" })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    if (res.ok) setUsers(await res.json())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    setIsCreating(false)
    setFormData({ name: "", email: "", nfcTagId: "", pin: "" })
    fetchUsers()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Trabajadores</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Trabajador
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Añadir Trabajador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Tarjeta NFC</Label>
                  <Input 
                    value={formData.nfcTagId} 
                    onChange={e => setFormData({...formData, nfcTagId: e.target.value})} 
                    placeholder="Escanea la tarjeta aquí..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>PIN (Opcional)</Label>
                  <Input 
                    value={formData.pin} 
                    onChange={e => setFormData({...formData, pin: e.target.value})} 
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
        {users.map(user => (
          <Card key={user.id}>
            <CardContent className="flex justify-between items-center p-6">
              <div>
                <h3 className="font-bold text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-right text-sm">
                <p>NFC: {user.nfcTagId || "No asignado"}</p>
                <p>PIN: {user.pin ? "****" : "No asignado"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
