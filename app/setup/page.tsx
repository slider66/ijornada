"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBrowser } from "@/components/setup/file-browser";
import { initializeDatabase } from "./actions";
import { Database, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SetupPage() {
    const [mode, setMode] = useState<"select" | "create" | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        setLoading(true);
        try {
            const result = await initializeDatabase();
            if (result.success) {
                toast.success("Base de datos creada correctamente");
                toast.info("Reiniciando aplicación...");
                // Force refresh after delay
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            } else {
                toast.error(result.message || "Error al crear la base de datos");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (path: string) => {
        setLoading(true);
        try {
            const result = await initializeDatabase(path);
            if (result.success) {
                toast.success("Base de datos configurada");
                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            } else {
                toast.error(result.message || "Error al configurar");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl">Configuración Inicial</CardTitle>
                    <CardDescription>
                        No se ha detectado una base de datos configurada. Por favor, selecciona una opción.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!mode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-32 flex flex-col gap-4 bg-transparent text-white hover:bg-zinc-800 hover:text-white border-zinc-700"
                                onClick={() => setMode("create")}
                            >
                                <Database className="h-8 w-8" />
                                <span className="text-lg">Crear Nueva BBDD</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-32 flex flex-col gap-4 bg-transparent text-white hover:bg-zinc-800 hover:text-white border-zinc-700"
                                onClick={() => setMode("select")}
                            >
                                <FolderOpen className="h-8 w-8" />
                                <span className="text-lg">Seleccionar Existente</span>
                            </Button>
                        </div>
                    )}

                    {mode === "create" && (
                        <div className="text-center space-y-4">
                            <p className="text-zinc-400">
                                Se creará una nueva base de datos local (dev.db) y se aplicará el esquema inicial.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="ghost" onClick={() => setMode(null)} disabled={loading}>
                                    Atrás
                                </Button>
                                <Button onClick={handleCreate} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear e Iniciar
                                </Button>
                            </div>
                        </div>
                    )}

                    {mode === "select" && (
                        <div className="space-y-4">
                            <FileBrowser onSelect={handleSelect} />
                            <div className="flex justify-start">
                                <Button variant="ghost" onClick={() => setMode(null)} disabled={loading}>
                                    Atrás
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
