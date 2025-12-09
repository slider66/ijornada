
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    // Attempt to query users and select the qrToken field to verify it exists
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        qrToken: true,
        vacationDays: true
      }
    });
    console.log('Connection successful.');
    console.log('Query successful. qrToken field exists.');
    if (user) {
        console.log('Found a user:', user);
    } else {
        console.log('No users found, but schema is valid.');
    }
  } catch (error) {
    console.error('Error connecting or querying:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
