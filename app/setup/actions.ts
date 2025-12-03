"use server";

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { redirect } from "next/navigation";

const execAsync = promisify(exec);

export type FileSystemItem = {
    name: string;
    path: string;
    isDirectory: boolean;
};

export async function getFileSystemItems(dirPath?: string): Promise<FileSystemItem[]> {
    const rootPath = path.parse(process.cwd()).root;
    const targetPath = dirPath ? path.resolve(dirPath) : rootPath;

    try {
        const items = await fs.promises.readdir(targetPath, { withFileTypes: true });

        return items.map((item) => ({
            name: item.name,
            path: path.join(targetPath, item.name),
            isDirectory: item.isDirectory(),
        })).sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
            return a.isDirectory ? -1 : 1;
        });
    } catch (error) {
        console.error("Error reading directory:", error);
        return [];
    }
}

export async function configureDatabase(dbPath: string) {
    // We need to verify if the file exists
    if (!fs.existsSync(dbPath)) {
        throw new Error("El archivo seleccionado no existe");
    }

    // Copy the selected file to the project root as dev.db
    const targetPath = path.join(process.cwd(), "dev.db");

    try {
        await fs.promises.copyFile(dbPath, targetPath);
        // We don't need to update .env because it's already set to look at ../dev.db (root)
    } catch (error) {
        console.error("Error configuring database:", error);
        throw new Error("Error al configurar la base de datos");
    }

    redirect("/");
}

export async function createNewDatabase() {
    try {
        // Run prisma migrate deploy to create the DB
        // We assume .env is already configured to file:../dev.db
        await execAsync("npx prisma migrate deploy");
    } catch (error) {
        console.error("Error creating database:", error);
        throw new Error("Error al crear la base de datos");
    }

    redirect("/");
}

export async function checkDatabaseStatus() {
    const dbPath = path.join(process.cwd(), "dev.db");
    return { configured: fs.existsSync(dbPath) };
}
