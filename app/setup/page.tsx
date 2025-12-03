"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileBrowser } from "@/components/setup/file-browser";
import { createNewDatabase, configureDatabase } from "./actions";
import { Database, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function SetupPage() {
    const [mode, setMode] = useState<"select" | "create" | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        try {
            toast.info("Creando base de datos...");
            await createNewDatabase();
            toast.success("Base de datos creada correctamente");
        } catch (error) {
            toast.error("Error al crear la base de datos");
            setLoading(false);
        }
    };

    const handleSelect = async (path: string) => {
        setLoading(true);
        try {
            toast.info("Configurando base de datos...");
            await configureDatabase(path);
            toast.success("Base de datos configurada correctamente");
        } catch (error) {
            toast.error("Error al configurar la base de datos");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Configuración de Base de Datos</CardTitle>
                    <CardDescription>
                        No se ha encontrado la base de datos en la raíz del proyecto. Por favor, selecciona una existente o crea una nueva.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!mode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-32 flex flex-col gap-4 text-lg"
                                onClick={() => setMode("select")}
                            >
                                <Search className="h-8 w-8" />
                                Localizar Existente
                            </Button>
                            <Button
                                variant="outline"
                                className="h-32 flex flex-col gap-4 text-lg"
                                onClick={() => setMode("create")}
                            >
                                <Plus className="h-8 w-8" />
                                Crear Nueva
                            </Button>
                        </div>
                    )}

                    {mode === "select" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Seleccionar Archivo .db</h3>
                                <Button variant="ghost" onClick={() => setMode(null)}>Volver</Button>
                            </div>
                            <FileBrowser onSelect={handleSelect} />
                        </div>
                    )}

                    {mode === "create" && (
                        <div className="space-y-4 text-center py-8">
                            <Database className="h-16 w-16 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">
                                Se creará una nueva base de datos SQLite (dev.db) en la raíz del proyecto y se ejecutarán las migraciones necesarias.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={() => setMode(null)} disabled={loading}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleCreate} disabled={loading}>
                                    {loading ? "Creando..." : "Crear Base de Datos"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
