"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, File, ArrowUp, Check } from "lucide-react";
import { getFileSystemItems, type FileSystemItem } from "@/app/setup/actions";
import { cn } from "@/lib/utils";

interface FileBrowserProps {
    onSelect: (path: string) => void;
}

export function FileBrowser({ onSelect }: FileBrowserProps) {
    const [currentPath, setCurrentPath] = useState<string>("");
    const [items, setItems] = useState<FileSystemItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initial load - assume server root or let action decide
        loadDirectory();
    }, []);

    const loadDirectory = async (path?: string) => {
        setLoading(true);
        try {
            const newItems = await getFileSystemItems(path);
            setItems(newItems);
            if (newItems.length > 0) {
                // Infer current path from first item's parent or just keep track manually
                // For simplicity, we'll rely on what we passed or update based on result if action returned it
                // But our action just returns items with full paths.
                // Let's extract the directory from the first item
                const firstPath = newItems[0].path;
                // This is a bit hacky for Windows/Unix compat without path module on client
                // We'll just update currentPath if we passed one, or set it if it's empty
                if (path) setCurrentPath(path);
            }
        } catch (error) {
            console.error("Failed to load directory", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        loadDirectory(path);
        setSelectedFile(null);
    };

    const handleUp = () => {
        // Simple string manipulation to go up
        // Warning: This is naive and might fail on root or complex paths
        // Better to have server return "parent" path
        const separator = currentPath.includes("\\") ? "\\" : "/";
        const parts = currentPath.split(separator);
        parts.pop();
        const parentPath = parts.join(separator) || (separator === "/" ? "/" : "C:\\"); // Fallback
        handleNavigate(parentPath);
    };

    return (
        <div className="border rounded-lg p-4 bg-zinc-950 text-white">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="icon" onClick={handleUp} disabled={!currentPath}>
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <div className="flex-1 truncate font-mono text-sm bg-zinc-900 p-2 rounded">
                    {currentPath || "Root"}
                </div>
            </div>

            <ScrollArea className="h-[300px] border border-zinc-800 rounded-md bg-zinc-900/50">
                <div className="p-2 space-y-1">
                    {loading ? (
                        <div className="text-center p-4 text-zinc-500">Cargando...</div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.path}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-zinc-800 transition-colors",
                                    selectedFile === item.path && "bg-blue-900/30 border border-blue-500/50"
                                )}
                                onClick={() => {
                                    if (item.isDirectory) {
                                        handleNavigate(item.path);
                                    } else {
                                        if (item.name.endsWith(".db") || item.name.endsWith(".sqlite")) {
                                            setSelectedFile(item.path);
                                        }
                                    }
                                }}
                            >
                                {item.isDirectory ? (
                                    <Folder className="h-4 w-4 text-yellow-500" />
                                ) : (
                                    <File className="h-4 w-4 text-zinc-400" />
                                )}
                                <span className="text-sm truncate flex-1">{item.name}</span>
                                {selectedFile === item.path && <Check className="h-4 w-4 text-blue-400" />}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="mt-4 flex justify-end">
                <Button
                    onClick={() => selectedFile && onSelect(selectedFile)}
                    disabled={!selectedFile}
                >
                    Seleccionar Base de Datos
                </Button>
            </div>
        </div>
    );
}
