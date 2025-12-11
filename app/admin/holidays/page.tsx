"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHolidays, createHoliday, deleteHoliday, importHolidays } from "./actions";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Calendar as CalendarIcon, Plus, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";

type Holiday = {
  id: string;
  date: Date;
  name: string;
  type: string;
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewHolidays, setPreviewHolidays] = useState<{ date: Date; name: string }[]>([]);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    const data = await getHolidays();
    setHolidays(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!selectedDate || !newName) {
      toast.error("Selecciona una fecha y escribe un nombre");
      return;
    }

    const result = await createHoliday(selectedDate, newName);
    if (result.success) {
      toast.success("Festivo añadido");
      setNewName("");
      loadHolidays();
    } else {
      toast.error("Error al añadir festivo");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Borrar este festivo?")) {
      const result = await deleteHoliday(id);
      if (result.success) {
        toast.success("Festivo eliminado");
        loadHolidays();
      } else {
        toast.error("Error al eliminar");
      }
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Fecha,Nombre\n2025-01-01,Año Nuevo\n2025-01-06,Reyes Magos";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla_festivos.csv";
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseCSV(file);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const parsed: { date: Date; name: string }[] = [];

      // Skip header if present (simple check)
      const startIndex = lines[0].toLowerCase().includes("fecha") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(",");
        if (parts.length >= 2) {
          const dateStr = parts[0].trim();
          const name = parts[1].trim();
          const date = new Date(dateStr);

          if (!isNaN(date.getTime()) && name) {
            parsed.push({ date, name });
          }
        }
      }
      setPreviewHolidays(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewHolidays.length === 0) {
      toast.error("No hay festivos válidos para importar");
      return;
    }

    const result = await importHolidays(previewHolidays);
    if (result.success) {
      toast.success(`${result.count} festivos importados`);
      setPreviewHolidays([]);
      loadHolidays();
    } else {
      toast.error("Error al importar");
    }
  };

  // Check if selected date is already a holiday
  const selectedHoliday = holidays.find(h => selectedDate && isSameDay(new Date(h.date), selectedDate));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Días Festivos y Vacaciones</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar & Add Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" /> Calendario de Festivos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Calendar
                mode="single"
                locale={es}
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border shadow"
                modifiers={{
                  holiday: holidays.map((h) => new Date(h.date)),
                  weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
                }}
                modifiersClassNames={{
                  holiday: "text-red-600 font-bold bg-red-100 hover:bg-red-200",
                  weekend: "bg-slate-100 text-slate-500",
                }}
              />

              <div className="w-full space-y-4 border-t pt-4">
                {selectedDate && (
                  <>
                    <div className="text-sm font-medium text-center">
                      {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </div>

                    {selectedHoliday ? (
                      <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
                        <p className="text-red-800 font-bold mb-2">{selectedHoliday.name}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(selectedHoliday.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar Festivo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Nuevo Festivo</Label>
                        <div className="flex gap-2">
                          <Input
                            id="name"
                            placeholder="Ej: Fiesta Local"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                          />
                          <Button onClick={handleAdd}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Import CSV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" /> Importar Masivo (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Descargar Plantilla
                </Button>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="csv">Subir CSV</Label>
                <Input
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>

              {previewHolidays.length > 0 && (
                <div className="bg-slate-50 p-3 rounded border text-sm">
                  <p className="font-medium mb-2">Vista Previa ({previewHolidays.length} festivos):</p>
                  <ul className="list-disc list-inside max-h-32 overflow-y-auto text-muted-foreground">
                    {previewHolidays.map((h, i) => (
                      <li key={i}>
                        {format(h.date, "dd/MM/yyyy")} - {h.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleImport}
                className="w-full"
                disabled={previewHolidays.length === 0}
              >
                <Upload className="mr-2 h-4 w-4" /> Importar {previewHolidays.length > 0 ? `(${previewHolidays.length})` : ""}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Month Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" /> Festivos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando...</div>
            ) : (
              <div className="space-y-4">
                <div className="text-lg font-semibold capitalize text-center border-b pb-2">
                  {selectedDate ? format(selectedDate, "MMMM yyyy", { locale: es }) : "Mes Actual"}
                </div>

                {(() => {
                  const currentMonthHolidays = holidays.filter(h =>
                    selectedDate &&
                    new Date(h.date).getMonth() === selectedDate.getMonth() &&
                    new Date(h.date).getFullYear() === selectedDate.getFullYear()
                  );

                  if (currentMonthHolidays.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        No hay festivos este mes.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {currentMonthHolidays.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded border"
                        >
                          <div>
                            <div className="font-medium">{h.name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {format(new Date(h.date), "EEEE d", { locale: es })}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(h.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
