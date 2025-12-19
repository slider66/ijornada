
import { createBackup } from "@/scripts/backup-db"
import { NextResponse } from "next/server"
import { readFileSync } from "fs"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Generate backup using the existing script logic
    const backupPath = await createBackup()
    
    // Read the file buffer
    const fileBuffer = readFileSync(backupPath)
    
    // Clean up: delete the file after reading (optional, or keep on server)
    // Let's keep it on server for safety or delete if we treat this as a download-only endpoint.
    // The user asked for "backup en local", likely implying download.
    // The script script/backup-db.ts returns the absolute path.
    
    // We will serve it and maybe delete it to save space if it's meant to be ephemeral for download.
    // For now, let's keep it on disk as a "server-side backup" that is also downloaded.
    
    // Get filename from path
    const filename = backupPath.split(/[\\/]/).pop() || "backup.json"

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 })
  }
}
