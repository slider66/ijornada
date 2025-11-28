"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"

export default function ExportsPage() {
  const handleDownload = () => {
    window.location.href = "/api/export"
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Informes y Exportaciones</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fichajes (CSV)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Descarga el historial completo de fichajes de todos los trabajadores en formato CSV compatible con Excel.
            </p>
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Descargar CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
