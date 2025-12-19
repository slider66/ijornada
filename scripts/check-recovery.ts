import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseRecovery() {
    console.log('Checking PostgreSQL for recovery options...\n')

    try {
        // Check if there are any system tables we can query
        const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `

        console.log('Available tables:')
        console.log(result)

        // Check for any audit logs or history tables
        const auditLogs = await prisma.auditLog.findMany({
            take: 20,
            orderBy: { timestamp: 'desc' }
        })

        console.log('\nRecent audit logs:')
        console.log(auditLogs)

        // Try to query PostgreSQL version and backup info
        const pgVersion = await prisma.$queryRaw`SELECT version();`
        console.log('\nPostgreSQL version:')
        console.log(pgVersion)

        // Check if there's any data in User table before reset
        const userCount = await prisma.user.count()
        console.log(`\nCurrent user count: ${userCount}`)

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

        console.log('\nCurrent users in database:')
        users.forEach(user => {
            console.log(`ID: ${user.id}`)
            console.log(`Name: ${user.name}`)
            console.log(`Email: ${user.email}`)
            console.log(`Created: ${user.createdAt}`)
            console.log(`Schedules: ${user.schedules.length}`)
            console.log('---')
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkDatabaseRecovery()
