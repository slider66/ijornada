"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, X, QrCode, Download, Mail, Barcode as BarcodeIcon } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import dynamic from "next/dynamic"
import { generateEAN13 } from "@/lib/ean13"

const Barcode = dynamic(() => import("react-barcode"), { ssr: false })

type User = {
  id: string
  name: string
  email: string | null
  nfcTagId: string | null
  pin: string | null
  qrToken: string | null
  role: string
  vacationDays?: number
  status?: "working" | "offline"
}

export default function WorkersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", nfcTagId: "", pin: "", qrToken: "" })
  const [qrUser, setQrUser] = useState<User | null>(null)

  // PIN Dialog State
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinError, setPinError] = useState("")

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
      qrToken: user.qrToken || "",
    })
    setIsCreating(true)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingUser(null)
    setFormData({ name: "", email: "", nfcTagId: "", pin: "", qrToken: "" })
  }

  const openPinDialog = () => {
    setNewPin("")
    setConfirmPin("")
    setPinError("")
    setIsPinDialogOpen(true)
  }

  const handlePinSubmit = () => {
    if (newPin !== confirmPin) {
      setPinError("Los PINs no coinciden")
      return
    }

    if (!/^\d+$/.test(newPin)) {
      setPinError("El PIN debe contener solo números")
      return
    }

    if (newPin.length < 4) {
      setPinError("El PIN debe tener al menos 4 dígitos")
      return
    }

    setFormData(prev => ({ ...prev, pin: newPin }))
    setIsPinDialogOpen(false)
    toast.success("PIN actualizado en el formulario (Recuerda Guardar)")
  }

  const handleGenerateNewQR = () => {
    const newToken = generateEAN13()
    setFormData(prev => ({ ...prev, qrToken: newToken }))
    toast.success("Código de Barras generado")
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

  const downloadBarcode = () => {
    // TODO: Implement barcode download (SVG to Image)
    // For now, we can print or use a library to convert SVG to Canvas
    window.print()
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={formData.pin}
                      readOnly
                      disabled
                      className="bg-muted"
                      placeholder={formData.pin ? "••••" : "No asignado"}
                    />
                    <Button type="button" variant="outline" onClick={openPinDialog}>
                      Cambiar PIN
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-between w-full">
                    <Label className="text-lg font-semibold">Credenciales de Acceso (QR y Código de Barras)</Label>
                    <Button type="button" variant="secondary" onClick={handleGenerateNewQR}>
                      <QrCode className="mr-2 h-4 w-4" /> Generar Nuevos Códigos
                    </Button>
                  </div>

                  {formData.qrToken ? (
                    <div className="flex flex-col items-center gap-6 w-full bg-muted/30 p-6 rounded-lg border border-dashed">
                      <div className="flex flex-col items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Código de Barras (EAN-13)</Label>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <Barcode value={formData.qrToken} format="EAN13" width={2} height={60} fontSize={16} />
                        </div>
                      </div>

                      <div className="flex gap-2 w-full max-w-md">
                        <Button type="button" variant="outline" className="flex-1" onClick={downloadBarcode}>
                          <Download className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                        <Button type="button" variant="outline" className="flex-1" asChild disabled={!formData.email}>
                          <a href={`mailto:${formData.email}?subject=Tus Credenciales de Acceso&body=Adjunto encontrarás tus códigos de acceso.`}>
                            <Mail className="mr-2 h-4 w-4" /> Enviar Email
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 w-full bg-muted/30 rounded-lg border border-dashed text-muted-foreground">
                      <div className="flex gap-2">
                        <BarcodeIcon className="h-8 w-8 mb-2 opacity-50" />
                      </div>
                      <p>Genera un código de barras para este trabajador</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
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
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  {user.status === "working" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      Trabajando
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                      <span className="w-2 h-2 mr-1.5 bg-orange-500 rounded-full"></span>
                      No trabajando
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user.email || "Sin email"}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    🏖️ {user.vacationDays || 0} Días de vacaciones
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <p>NFC: {user.nfcTagId || "No asignado"}</p>
                  <p>PIN: {user.pin ? "****" : "No asignado"}</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => setQrUser(user)} title="Ver Códigos">
                  <BarcodeIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleEdit(user)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!qrUser} onOpenChange={(open: boolean) => !open && setQrUser(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Credenciales de Acceso</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
              <div className="flex flex-col items-center gap-2">
                <Label className="font-semibold">Código de Barras (EAN-13)</Label>
                {qrUser?.qrToken ? (
                  <div className="bg-white p-6 border rounded-lg">
                    <Barcode value={qrUser.qrToken} format="EAN13" width={2} height={80} fontSize={18} />
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-muted-foreground">
                    Sin código asignado
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground max-w-md">
              Estos códigos son únicos para {qrUser?.name}.<br />
              Pueden usarse para fichar en el kiosco mediante cámara o lector láser.
            </p>

            <div className="flex gap-2 w-full max-w-md">
              <Button className="flex-1" onClick={downloadBarcode}>
                <Download className="mr-2 h-4 w-4" /> Imprimir
              </Button>
              <Button className="flex-1" variant="outline" asChild disabled={!qrUser?.email}>
                <a href={`mailto:${qrUser?.email}?subject=Tus Credenciales de Acceso&body=Adjunto encontrarás tus códigos de acceso.`}>
                  <Mail className="mr-2 h-4 w-4" /> Enviar Email
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinDialog
        open={isPinDialogOpen}
        onOpenChange={setIsPinDialogOpen}
        newPin={newPin}
        setNewPin={setNewPin}
        confirmPin={confirmPin}
        setConfirmPin={setConfirmPin}
        error={pinError}
        onSubmit={handlePinSubmit}
      />

      {/* Print Layout */}
      {qrUser && (
        <>
          <style jsx global>{`
            @media print {
              @page {
                size: auto;
                margin: 0mm;
              }
              body * {
                visibility: hidden;
              }
              #printable-card, #printable-card * {
                visibility: visible;
              }
              #printable-card {
                position: fixed;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 85.6mm;
                height: 53.98mm;
                border: 1px solid #000;
                border-radius: 3mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: white;
                padding: 4mm;
                gap: 2mm;
              }
            }
          `}</style>
          <div id="printable-card" className="hidden">
            <h2 className="text-xl font-bold text-center leading-tight w-full truncate px-2">{qrUser.name}</h2>
            {qrUser.qrToken && (
              <Barcode value={qrUser.qrToken} format="EAN13" width={2} height={50} fontSize={14} displayValue={true} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PinDialog({ open, onOpenChange, newPin, setNewPin, confirmPin, setConfirmPin, error, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPin: string;
  setNewPin: (s: string) => void;
  confirmPin: string;
  setConfirmPin: (s: string) => void;
  error: string;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar PIN</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm border border-yellow-200">
            ⚠️ El PIN debe componerse únicamente de números.
          </div>
          <div className="space-y-2">
            <Label>Nuevo PIN</Label>
            <Input
              type="password"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              placeholder="Introduce nuevo PIN"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmar PIN</Label>
            <Input
              type="password"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value)}
              placeholder="Confirma el PIN"
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={onSubmit}>Confirmar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
