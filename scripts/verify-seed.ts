import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userCount = await prisma.user.count()
  console.log(`Total users: ${userCount}`)

  const users = await prisma.user.findMany({
    include: {
      schedules: {
        include: {
          slots: true
        }
      }
    }
  })

  for (const user of users) {
    console.log(`User: ${user.name} (${user.email})`)
    console.log(`  Schedules: ${user.schedules.length} days`)
    if (user.schedules.length > 0) {
      const firstDay = user.schedules[0]
      console.log(`  Sample Day ${firstDay.dayOfWeek}: ${firstDay.slots.length} slots`)
      for (const slot of firstDay.slots) {
        console.log(`    - ${slot.startTime} to ${slot.endTime}`)
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
