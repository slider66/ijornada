"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type CompanyClosureData = {
    id?: string
    name: string
    startDate: Date
    endDate: Date
    description?: string
}

// Obtener todos los cierres de empresa
export async function getCompanyClosures() {
    try {
        const closures = await prisma.companyClosure.findMany({
            orderBy: { startDate: 'asc' }
        })
        return closures
    } catch (error) {
        console.error("Error fetching company closures:", error)
        return []
    }
}

// Crear un nuevo cierre de empresa
export async function createCompanyClosure(data: CompanyClosureData) {
    try {
        const closure = await prisma.companyClosure.create({
            data: {
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                description: data.description
            }
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "COMPANY_CLOSURE_CREATE",
                details: `Created company closure: ${data.name} (${data.startDate.toISOString().split('T')[0]} - ${data.endDate.toISOString().split('T')[0]})`,
                performedBy: "ADMIN"
            }
        })

        revalidatePath("/admin/company-closures")
        return { success: true, closure }
    } catch (error) {
        console.error("Error creating company closure:", error)
        return { success: false, error: "Failed to create closure" }
    }
}

// Actualizar un cierre existente
export async function updateCompanyClosure(id: string, data: CompanyClosureData) {
    try {
        const closure = await prisma.companyClosure.update({
            where: { id },
            data: {
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                description: data.description
            }
        })

        await prisma.auditLog.create({
            data: {
                action: "COMPANY_CLOSURE_UPDATE",
                details: `Updated company closure: ${data.name}`,
                performedBy: "ADMIN"
            }
        })

        revalidatePath("/admin/company-closures")
        return { success: true, closure }
    } catch (error) {
        console.error("Error updating company closure:", error)
        return { success: false, error: "Failed to update closure" }
    }
}

// Eliminar un cierre
export async function deleteCompanyClosure(id: string) {
    try {
        const closure = await prisma.companyClosure.delete({
            where: { id }
        })

        await prisma.auditLog.create({
            data: {
                action: "COMPANY_CLOSURE_DELETE",
                details: `Deleted company closure: ${closure.name}`,
                performedBy: "ADMIN"
            }
        })

        revalidatePath("/admin/company-closures")
        return { success: true }
    } catch (error) {
        console.error("Error deleting company closure:", error)
        return { success: false, error: "Failed to delete closure" }
    }
}

// Verificar si una fecha está dentro de un período de cierre
export async function isDateInClosure(date: Date): Promise<boolean> {
    try {
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

        const closure = await prisma.companyClosure.findFirst({
            where: {
                AND: [
                    { startDate: { lte: dateOnly } },
                    { endDate: { gte: dateOnly } }
                ]
            }
        })

        return !!closure
    } catch (error) {
        console.error("Error checking closure:", error)
        return false
    }
}

// Obtener cierre para una fecha específica
export async function getClosureForDate(date: Date) {
    try {
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

        const closure = await prisma.companyClosure.findFirst({
            where: {
                AND: [
                    { startDate: { lte: dateOnly } },
                    { endDate: { gte: dateOnly } }
                ]
            }
        })

        return closure
    } catch (error) {
        console.error("Error getting closure for date:", error)
        return null
    }
}

// Obtener días de cierre en un rango de fechas
export async function getClosureDaysInRange(startDate: Date, endDate: Date): Promise<Date[]> {
    try {
        const closures = await prisma.companyClosure.findMany({
            where: {
                OR: [
                    {
                        AND: [
                            { startDate: { lte: endDate } },
                            { endDate: { gte: startDate } }
                        ]
                    }
                ]
            }
        })

        const closureDays: Date[] = []

        closures.forEach(closure => {
            const currentDate = new Date(Math.max(closure.startDate.getTime(), startDate.getTime()))
            const lastDate = new Date(Math.min(closure.endDate.getTime(), endDate.getTime()))

            while (currentDate <= lastDate) {
                closureDays.push(new Date(currentDate))
                currentDate.setDate(currentDate.getDate() + 1)
            }
        })

        return closureDays
    } catch (error) {
        console.error("Error getting closure days:", error)
        return []
    }
}
