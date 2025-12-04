import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Attempting to connect to database...')
    await prisma.$connect()
    console.log('Successfully connected to database!')
    
    // Try a simple query to ensure read access
    const userCount = await prisma.user.count()
    console.log(`Connection verified. Found ${userCount} users.`)
    
  } catch (error) {
    console.error('Error connecting to database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
