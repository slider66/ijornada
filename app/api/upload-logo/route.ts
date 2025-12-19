import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("logo") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only PNG, JPG, JPEG, and SVG are allowed." },
                { status: 400 }
            );
        }

        // Validate file size (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 2MB limit." },
                { status: 400 }
            );
        }

        // Create company-logos directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "company-logos");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split(".").pop();
        const filename = `company-logo-${timestamp}.${extension}`;
        const filepath = join(uploadDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return the public path
        const publicPath = `/company-logos/${filename}`;

        return NextResponse.json({
            success: true,
            path: publicPath,
        });
    } catch (error) {
        console.error("Error uploading logo:", error);
        return NextResponse.json(
            { error: "Failed to upload logo" },
            { status: 500 }
        );
    }
}
