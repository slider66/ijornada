import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSchedules() {
    console.log('Verificando horarios en base de datos...\n')

    try {
        const users = await prisma.user.findMany({
            include: {
                schedules: {
                    include: {
                        slots: true
                    },
                    orderBy: {
                        dayOfWeek: 'asc'
                    }
                }
            }
        })

        console.log(`Total de usuarios: ${users.length}\n`)

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

        for (const user of users) {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`👤 ${user.name} (${user.email || 'sin email'})`)
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

            if (user.schedules.length === 0) {
                console.log('  ❌ NO tiene horarios configurados')
            } else {
                console.log(`  ✅ Tiene ${user.schedules.length} día(s) con horario:\n`)

                for (const schedule of user.schedules) {
                    const dayName = dayNames[schedule.dayOfWeek]
                    console.log(`  📅 ${dayName}:`)

                    if (schedule.slots.length === 0) {
                        console.log(`     ⚠️  Sin franjas horarias`)
                    } else {
                        schedule.slots.forEach((slot, index) => {
                            console.log(`     ${index + 1}. ${slot.startTime} - ${slot.endTime}`)
                        })
                    }
                    console.log('')
                }
            }
            console.log('')
        }

        // Resumen
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 RESUMEN:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const usersWithSchedules = users.filter(u => u.schedules.length > 0)
        const usersWithoutSchedules = users.filter(u => u.schedules.length === 0)

        console.log(`✅ Usuarios CON horarios: ${usersWithSchedules.length}`)
        console.log(`❌ Usuarios SIN horarios: ${usersWithoutSchedules.length}`)

        const totalSchedules = users.reduce((sum, u) => sum + u.schedules.length, 0)
        const totalSlots = users.reduce((sum, u) =>
            sum + u.schedules.reduce((s, sch) => s + sch.slots.length, 0), 0)

        console.log(`📅 Total días con horario: ${totalSchedules}`)
        console.log(`⏰ Total franjas horarias: ${totalSlots}`)

        await prisma.$disconnect()
    } catch (error) {
        console.error('Error al verificar horarios:', error)
        await prisma.$disconnect()
        process.exit(1)
    }
}

checkSchedules()
