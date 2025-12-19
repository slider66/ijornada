
import { prisma } from "../lib/prisma"

async function main() {
  console.log("Checking CompanyClosure access...")
  try {
    const count = await prisma.companyClosure.count()
    console.log(`Successfully connected. Found ${count} closures.`)
  } catch (error) {
    console.error("Error accessing CompanyClosure:", error)
    process.exit(1)
  }
}

main()
