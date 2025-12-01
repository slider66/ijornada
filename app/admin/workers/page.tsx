"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, X } from "lucide-react"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string | null
  nfcTagId: string | null
  pin: string | null
  role: string
}

export default function WorkersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", nfcTagId: "", pin: "" })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    if (res.ok) setUsers(await res.json())
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email || "",
      nfcTagId: user.nfcTagId || "",
      pin: user.pin || "",
    })
    setIsCreating(true)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingUser(null)
    setFormData({ name: "", email: "", nfcTagId: "", pin: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = "/api/users"
      const method = editingUser ? "PUT" : "POST"
      const body = editingUser ? { ...formData, id: editingUser.id } : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingUser ? "Trabajador actualizado" : "Trabajador creado")
        handleCancel()
        fetchUsers()
      } else {
        const error = await res.json()
        toast.error(error.error || "Error al guardar")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Trabajadores</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Trabajador
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Editar Trabajador" : "Añadir Trabajador"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (Opcional)</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Tarjeta NFC</Label>
                  <Input
                    value={formData.nfcTagId}
                    onChange={e => setFormData({ ...formData, nfcTagId: e.target.value })}
                    placeholder="Escanea la tarjeta aquí..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>PIN (Opcional)</Label>
                  <Input
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
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
                <p className="text-sm text-muted-foreground">{user.email || "Sin email"}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <p>NFC: {user.nfcTagId || "No asignado"}</p>
                  <p>PIN: {user.pin ? "****" : "No asignado"}</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => handleEdit(user)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
