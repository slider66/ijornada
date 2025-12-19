import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function attemptRecovery() {
    console.log('ATTEMPTING DATABASE RECOVERY...\n')

    try {
        // 1. Check for PostgreSQL Point-in-Time Recovery capabilities
        console.log('1. Checking PostgreSQL configuration...')
        const walLevel = await prisma.$queryRaw`SHOW wal_level;`
        console.log('WAL Level:', walLevel)

        const archiveMode = await prisma.$queryRaw`SHOW archive_mode;`
        console.log('Archive Mode:', archiveMode)

        // 2. Check if there are any recent transactions we can inspect
        console.log('\n2. Checking for recent database activity...')
        const recentActivity = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY last_autoanalyze DESC NULLS LAST
      LIMIT 10;
    `
        console.log('Recent table activity:', recentActivity)

        // 3. Check audit logs for any historical data
        console.log('\n3. Checking audit logs...')
        const auditLogs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 50
        })
        console.log(`Found ${auditLogs.length} audit log entries`)

        if (auditLogs.length > 0) {
            console.log('\nRecent audit entries:')
            auditLogs.slice(0, 10).forEach(log => {
                console.log(`[${log.timestamp.toISOString()}] ${log.action}: ${log.details}`)
            })
        }

        // 4. Check for any orphaned data in related tables
        console.log('\n4. Checking for orphaned data...')
        const clockIns = await prisma.clockIn.count()
        const incidents = await prisma.incident.count()
        const schedules = await prisma.schedule.count()

        console.log(`Clock-ins: ${clockIns}`)
        console.log(`Incidents: ${incidents}`)
        console.log(`Schedules: ${schedules}`)

        // 5. Try to get database backup information
        console.log('\n5. Checking for backup extensions...')
        const extensions = await prisma.$queryRaw`
      SELECT extname, extversion 
      FROM pg_extension;
    `
        console.log('Installed extensions:', extensions)

        // 6. Get database size and last modification
        console.log('\n6. Database information...')
        const dbInfo = await prisma.$queryRaw`
      SELECT 
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size,
        pg_stat_database.stats_reset
      FROM pg_database
      JOIN pg_stat_database ON pg_database.datname = pg_stat_database.datname
      WHERE pg_database.datname = current_database();
    `
        console.log('Database info:', dbInfo)

    } catch (error) {
        console.error('Error during recovery attempt:', error)
    } finally {
        await prisma.$disconnect()
    }
}

attemptRecovery()
