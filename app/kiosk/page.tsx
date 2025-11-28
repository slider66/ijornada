"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Settings } from "lucide-react"

export default function KioskPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("Escanea tu tarjeta o huella")
  const [inputBuffer, setInputBuffer] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const lastKeyTime = useRef(0)

  // Audio refs
  const successAudio = useRef<HTMLAudioElement | null>(null)
  const errorAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    successAudio.current = new Audio("/sounds/success.mp3")
    errorAudio.current = new Audio("/sounds/error.mp3")
    
    // Clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      
      // Reset buffer if typing is too slow (manual entry vs scanner)
      if (now - lastKeyTime.current > 100) {
        setInputBuffer("")
      }
      lastKeyTime.current = now

      if (e.key === "Enter") {
        if (inputBuffer.length > 0) {
          handleClockIn(inputBuffer)
          setInputBuffer("")
        }
      } else {
        if (e.key.length === 1) {
          setInputBuffer(prev => prev + e.key)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [inputBuffer])

  const handleClockIn = async (identifier: string) => {
    try {
      const res = await fetch("/api/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          method: "NFC", 
          type: "IN", // Logic to toggle IN/OUT should be handled by backend or UI state
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setStatus("success")
        setMessage(`Fichaje Correcto: ${new Date().toLocaleTimeString()}`)
        successAudio.current?.play()
      } else {
        throw new Error("Failed")
      }
    } catch (err) {
      setStatus("error")
      setMessage("Error al fichar. Inténtalo de nuevo.")
      errorAudio.current?.play()
    }

    setTimeout(() => {
      setStatus("idle")
      setMessage("Escanea tu tarjeta o huella")
    }, 3000)
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center transition-colors duration-500 relative",
      status === "idle" && "bg-background",
      status === "success" && "bg-green-500",
      status === "error" && "bg-red-500"
    )}>
      {/* Admin Button */}
      <div className="absolute top-4 right-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="opacity-50 hover:opacity-100">
            <Settings className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="text-center space-y-8">
        <div className="space-y-2">
           <h2 className="text-6xl font-bold tracking-tighter">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h2>
          <p className="text-2xl text-muted-foreground capitalize">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <Card className="p-12 text-center shadow-2xl min-w-[500px] border-2">
          <h1 className="text-4xl font-bold mb-8">iJornada</h1>
          <p className="text-2xl font-medium">{message}</p>
          <div className="mt-12 text-sm text-muted-foreground animate-pulse">
            Esperando lectura...
          </div>
        </Card>
      </div>
    </div>
  )
}
