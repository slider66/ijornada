"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Pencil, Calendar, Building } from "lucide-react"
import { toast } from "sonner"
import {
    getCompanyClosures,
    createCompanyClosure,
    updateCompanyClosure,
    deleteCompanyClosure,
    type CompanyClosureData
} from "./actions"

type Closure = {
    id: string
    name: string
    startDate: Date
    endDate: Date
    description: string | null
    createdAt: Date
    updatedAt: Date
}

export default function CompanyClosuresPage() {
    const [closures, setClosures] = useState<Closure[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [editingClosure, setEditingClosure] = useState<Closure | null>(null)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        startDate: "",
        endDate: "",
        description: ""
    })

    useEffect(() => {
        fetchClosures()
    }, [])

    const fetchClosures = async () => {
        const data = await getCompanyClosures()
        setClosures(data as Closure[])
    }

    const handleEdit = (closure: Closure) => {
        setEditingClosure(closure)
        setFormData({
            name: closure.name,
            startDate: formatDateForInput(closure.startDate),
            endDate: formatDateForInput(closure.endDate),
            description: closure.description || ""
        })
        setIsCreating(true)
    }

    const handleCancel = () => {
        setIsCreating(false)
        setEditingClosure(null)
        setFormData({ name: "", startDate: "", endDate: "", description: "" })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.startDate || !formData.endDate) {
            toast.error("Por favor completa todos los campos obligatorios")
            return
        }

        const startDate = new Date(formData.startDate)
        const endDate = new Date(formData.endDate)

        if (startDate > endDate) {
            toast.error("La fecha de inicio debe ser anterior a la fecha de fin")
            return
        }

        setLoading(true)

        try {
            const data: CompanyClosureData = {
                name: formData.name,
                startDate,
                endDate,
                description: formData.description || undefined
            }

            let result
            if (editingClosure) {
                result = await updateCompanyClosure(editingClosure.id, data)
            } else {
                result = await createCompanyClosure(data)
            }

            if (result.success) {
                toast.success(editingClosure ? "Cierre actualizado" : "Cierre creado")
                handleCancel()
                fetchClosures()
            } else {
                toast.error(result.error || "Error al guardar")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (closure: Closure) => {
        if (!confirm(`¿Eliminar el cierre "${closure.name}"?`)) {
            return
        }

        setLoading(true)
        const result = await deleteCompanyClosure(closure.id)
        setLoading(false)

        if (result.success) {
            toast.success("Cierre eliminado")
            fetchClosures()
        } else {
            toast.error("Error al eliminar")
        }
    }

    const formatDateForInput = (date: Date): string => {
        const d = new Date(date)
        return d.toISOString().split('T')[0]
    }

    const formatDateForDisplay = (date: Date): string => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const calculateDays = (start: Date, end: Date): number => {
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays + 1 // +1 to include both start and end dates
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Cierres de Empresa</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona períodos de cierre total de la empresa (vacaciones colectivas)
                    </p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cierre
                    </Button>
                )}
            </div>

            {isCreating && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingClosure ? "Editar Cierre" : "Nuevo Cierre"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>Nombre del Cierre *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="ej: Navidad 2024, Verano 2025"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha de Inicio *</Label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha de Fin *</Label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Descripción (Opcional)</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="ej: Cierre por festividades navideñas"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Guardando..." : "Guardar"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {closures.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay cierres de empresa programados</p>
                            <p className="text-sm mt-2">
                                Los cierres de empresa son períodos donde toda la empresa está cerrada
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    closures.map(closure => {
                        const days = calculateDays(closure.startDate, closure.endDate)
                        const isPast = new Date(closure.endDate) < new Date()
                        const isCurrent = new Date() >= new Date(closure.startDate) && new Date() <= new Date(closure.endDate)

                        return (
                            <Card key={closure.id} className={isCurrent ? "border-orange-300 bg-orange-50" : isPast ? "opacity-60" : ""}>
                                <CardContent className="flex justify-between items-start p-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-lg">{closure.name}</h3>
                                            {isCurrent && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded-full">
                                                    ACTIVO AHORA
                                                </span>
                                            )}
                                            {isPast && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-400 text-white rounded-full">
                                                    PASADO
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {formatDateForDisplay(closure.startDate)} - {formatDateForDisplay(closure.endDate)}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                ({days} día{days !== 1 ? 's' : ''})
                                            </span>
                                        </div>
                                        {closure.description && (
                                            <p className="text-sm text-muted-foreground">
                                                📝 {closure.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleEdit(closure)}
                                            disabled={loading}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleDelete(closure)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
