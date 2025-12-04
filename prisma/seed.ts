import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Create 6 workers
  for (let i = 1; i <= 6; i++) {
    const email = `worker${i}@example.com`
    const name = `Worker ${i}`
    
    // Check if user exists to avoid duplicates if run multiple times
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`User ${email} already exists, skipping...`)
      continue
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'USER',
        // Create schedules for Monday (1) to Friday (5)
        schedules: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            slots: {
              create: [
                { startTime: '08:00', endTime: '13:00' },
                { startTime: '14:00', endTime: '17:00' },
              ],
            },
          })),
        },
      },
    })
    console.log(`Created user with id: ${user.id}`)
  }

  console.log('Seeding finished.')
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
