import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
    console.log('Checking database status...\n')

    // Count users
    const userCount = await prisma.user.count()
    console.log(`Total users: ${userCount}`)

    // Get all users
    const users = await prisma.user.findMany({
        include: {
            schedules: {
                include: {
                    slots: true
                }
            }
        }
    })

    console.log('\nUsers:')
    users.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`)
        console.log(`    Schedules: ${user.schedules.length}`)
    })

    // Count clock ins
    const clockInCount = await prisma.clockIn.count()
    console.log(`\nTotal clock-ins: ${clockInCount}`)

    // Get today's clock ins
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayClockIns = await prisma.clockIn.findMany({
        where: {
            timestamp: {
                gte: today,
                lt: tomorrow
            }
        },
        include: {
            user: true
        }
    })

    console.log(`\nToday's clock-ins: ${todayClockIns.length}`)
    todayClockIns.forEach(ci => {
        console.log(`  - ${ci.user.name}: ${ci.type} at ${ci.timestamp.toLocaleTimeString()}`)
    })

    await prisma.$disconnect()
}

checkDatabase()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
