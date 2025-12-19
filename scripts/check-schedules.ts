import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSchedules() {
    const users = await prisma.user.findMany({
        include: {
            schedules: {
                include: {
                    slots: true
                }
            }
        }
    })

    console.log('Detailed schedule info:\n')

    for (const user of users) {
        console.log(`${user.name}:`)
        for (const schedule of user.schedules) {
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
            console.log(`  ${dayNames[schedule.dayOfWeek]}:`)
            for (const slot of schedule.slots) {
                console.log(`    ${slot.startTime} - ${slot.endTime}`)
            }
        }
        console.log('')
    }

    await prisma.$disconnect()
}

checkSchedules()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
