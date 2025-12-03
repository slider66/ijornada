"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, X, Keyboard } from "lucide-react"

interface ScannerConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ScannerConfigDialog({ open, onOpenChange }: ScannerConfigDialogProps) {
    const [testInput, setTestInput] = useState("")
    const [lastScan, setLastScan] = useState<{ text: string, timestamp: number } | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            setTestInput("")
            setLastScan(null)
        }
    }, [open])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            setLastScan({
                text: testInput,
                timestamp: Date.now()
            })
            setTestInput("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Configuración de Lector QR</DialogTitle>
                    <DialogDescription>
                        Prueba tu lector aquí. Haz clic en el campo de abajo y escanea un código.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Área de Prueba</Label>
                        <div className="relative">
                            <Keyboard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pl-9"
                                placeholder="Haz clic aquí y escanea..."
                                autoComplete="off"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            El lector debe escribir el código y pulsar "Enter" automáticamente.
                        </p>
                    </div>

                    {lastScan && (
                        <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Último escaneo recibido:</span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(lastScan.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="p-2 bg-background rounded border font-mono text-sm break-all">
                                {lastScan.text}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <Check className="h-4 w-4" />
                                <span>Tecla ENTER detectada correctamente</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
