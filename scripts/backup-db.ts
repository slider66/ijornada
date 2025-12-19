import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = join(process.cwd(), 'backups', 'database')

    // Crear directorio si no existe
    try {
        mkdirSync(backupDir, { recursive: true })
    } catch (e) {
        // Directorio ya existe
    }

    console.log('🔒 CREANDO BACKUP DE BASE DE DATOS...')
    console.log(`Fecha: ${new Date().toLocaleString()}`)

    try {
        // Obtener todos los datos
        const [users, clockIns, schedules, timeSlots, incidents, holidays, systemConfig, auditLogs, companyInfo] = await Promise.all([
            prisma.user.findMany({ include: { schedules: { include: { slots: true } }, clockIns: true, incidents: true } }),
            prisma.clockIn.findMany(),
            prisma.schedule.findMany({ include: { slots: true } }),
            prisma.timeSlot.findMany(),
            prisma.incident.findMany(),
            prisma.holiday.findMany(),
            prisma.systemConfig.findMany(),
            prisma.auditLog.findMany(),
            prisma.companyInfo.findMany()
        ])

        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                users,
                clockIns,
                schedules,
                timeSlots,
                incidents,
                holidays,
                systemConfig,
                auditLogs,
                companyInfo
            },
            counts: {
                users: users.length,
                clockIns: clockIns.length,
                schedules: schedules.length,
                timeSlots: timeSlots.length,
                incidents: incidents.length,
                holidays: holidays.length,
                systemConfig: systemConfig.length,
                auditLogs: auditLogs.length,
                companyInfo: companyInfo.length
            }
        }

        const filename = `backup_${timestamp}.json`
        const filepath = join(backupDir, filename)

        writeFileSync(filepath, JSON.stringify(backup, null, 2))

        console.log('✅ BACKUP COMPLETADO EXITOSAMENTE')
        console.log(`📁 Ubicación: ${filepath}`)
        console.log(`📊 Registros guardados:`)
        console.log(`   - Usuarios: ${backup.counts.users}`)
        console.log(`   - Fichajes: ${backup.counts.clockIns}`)
        console.log(`   - Horarios: ${backup.counts.schedules}`)
        console.log(`   - Incidencias: ${backup.counts.incidents}`)
        console.log('')

        return filepath
    } catch (error) {
        console.error('❌ ERROR AL CREAR BACKUP:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Si se ejecuta directamente
if (require.main === module) {
    createBackup()
        .then(filepath => {
            console.log(`Backup guardado en: ${filepath}`)
            process.exit(0)
        })
        .catch(error => {
            console.error('Error fatal:', error)
            process.exit(1)
        })
}

export { createBackup }
