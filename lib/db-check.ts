import fs from "fs";
import path from "path";

export function checkDatabaseExists() {
    const dbPath = path.join(process.cwd(), "dev.db");
    return fs.existsSync(dbPath);
}
