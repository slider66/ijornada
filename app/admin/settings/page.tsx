"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSystemConfig, updateSystemConfig } from "./actions";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const data = await getSystemConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleSave = async (key: string, value: string) => {
    const result = await updateSystemConfig(key, value);
    if (result.success) {
      toast.success("Configuración guardada");
      setConfig((prev) => ({ ...prev, [key]: value }));
    } else {
      toast.error("Error al guardar");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración del Sistema</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Fechas del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="pilot-date">Fecha Inicio Piloto</Label>
              <div className="flex gap-2">
                <Input
                  id="pilot-date"
                  type="date"
                  value={config["PILOT_START_DATE"] || ""}
                  onChange={(e) => setConfig({ ...config, "PILOT_START_DATE": e.target.value })}
                />
                <Button onClick={() => handleSave("PILOT_START_DATE", config["PILOT_START_DATE"])}>
                  Guardar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Los datos anteriores a esta fecha serán ignorados en las estadísticas si no hay fecha de producción definida.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prod-date">Fecha Inicio Producción</Label>
              <div className="flex gap-2">
                <Input
                  id="prod-date"
                  type="date"
                  value={config["PRODUCTION_START_DATE"] || ""}
                  onChange={(e) => setConfig({ ...config, "PRODUCTION_START_DATE": e.target.value })}
                />
                <Button onClick={() => handleSave("PRODUCTION_START_DATE", config["PRODUCTION_START_DATE"])}>
                  Guardar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Si se define, esta fecha tiene prioridad sobre la fecha piloto. Los datos anteriores serán ignorados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
