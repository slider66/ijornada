"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface ScannerListenerProps {
    onScan: (token: string) => void
    isActive: boolean
}

export function ScannerListener({ onScan, isActive }: ScannerListenerProps) {
    const buffer = useRef<string>("")
    const lastKeyTime = useRef<number>(0)
    const [lastScanned, setLastScanned] = useState<string | null>(null)

    useEffect(() => {
        if (!isActive) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            const currentTime = Date.now()

            // If too much time passed between keystrokes, reset buffer (it's likely manual typing)
            // Scanners usually type very fast (<50ms per key)
            if (currentTime - lastKeyTime.current > 100) {
                buffer.current = ""
            }

            lastKeyTime.current = currentTime

            if (e.key === "Enter") {
                if (buffer.current.length > 5) { // Minimal length check
                    const token = buffer.current
                    onScan(token)
                    setLastScanned(token)
                    toast.success("Código escaneado")
                }
                buffer.current = ""
            } else if (e.key.length === 1) {
                // Only printable characters
                buffer.current += e.key
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isActive, onScan])

    return (
        <div className="hidden">
            {/* Invisible component just for logic */}
        </div>
    )
}
