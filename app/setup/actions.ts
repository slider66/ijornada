"use server";

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type FileSystemItem = {
    name: string;
    isDirectory: boolean;
    path: string;
};

export async function checkDatabaseStatus() {
    try {
        // Check if .env exists
        const envPath = path.join(process.cwd(), ".env");
        try {
            await fs.access(envPath);
        } catch {
            return { configured: false, reason: "missing_env" };
        }

        // Read .env to find DATABASE_URL
        const envContent = await fs.readFile(envPath, "utf-8");
        const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);

        if (!match) {
            return { configured: false, reason: "missing_url" };
        }

        const dbUrl = match[1];

        // If it's a file path (sqlite), check if file exists
        if (dbUrl.startsWith("file:")) {
            const dbPath = dbUrl.replace("file:", "");
            const absoluteDbPath = path.resolve(process.cwd(), dbPath);
            try {
                await fs.access(absoluteDbPath);
                return { configured: true };
            } catch {
                return { configured: false, reason: "missing_db_file" };
            }
        }

        return { configured: true };
    } catch (error) {
        console.error("Error checking DB status:", error);
        return { configured: false, reason: "error" };
    }
}

export async function getFileSystemItems(dirPath: string = process.cwd()): Promise<FileSystemItem[]> {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        const result = items.map((item) => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(dirPath, item.name),
        }));

        // Sort: Directories first, then files
        return result.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
        });
    } catch (error) {
        console.error("Error reading directory:", error);
        return [];
    }
}

export async function initializeDatabase(dbPath?: string) {
    try {
        const envPath = path.join(process.cwd(), ".env");
        let dbUrl = "";

        if (dbPath) {
            // Use existing file
            // Ensure path is properly formatted for Prisma (absolute paths need care on Windows)
            // For simplicity, we'll try to use a relative path if inside project, or absolute
            dbUrl = `file:${dbPath}`;
        } else {
            // Create new default
            dbUrl = "file:./dev.db";
        }

        // Write .env
        const envContent = `DATABASE_URL="${dbUrl}"\nAUTH_SECRET="secret-placeholder-$(date +%s)"`;
        await fs.writeFile(envPath, envContent);

        // If creating new or ensuring schema is applied
        if (!dbPath) {
            // Run migrations
            // Note: This might fail if the process doesn't have access or if dev server locks things
            // We'll try our best
            try {
                await execAsync("npx prisma migrate deploy", { cwd: process.cwd() });
            } catch (e) {
                console.error("Migration failed:", e);
                return { success: false, message: "Failed to run migrations. Please run 'npx prisma migrate deploy' manually." };
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error initializing DB:", error);
        return { success: false, message: "Failed to configure database." };
    }
}
