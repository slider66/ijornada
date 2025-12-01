"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Settings, Delete, Check, X } from "lucide-react"
import { verifyPin, type PinVerificationResult } from "./kiosk/actions"
import { AnimatePresence, motion } from "framer-motion"

export default function KioskPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [message, setMessage] = useState("Introduce tu PIN")
  const [pin, setPin] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastResult, setLastResult] = useState<PinVerificationResult | null>(null)

  // Audio refs
  const successInAudio = useRef<HTMLAudioElement | null>(null)
  const successOutAudio = useRef<HTMLAudioElement | null>(null)
  const errorAudio = useRef<HTMLAudioElement | null>(null)
  const enterCorrectAudio = useRef<HTMLAudioElement | null>(null)
  const exitCorrectAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    successInAudio.current = new Audio("/sounds/success-in.mp3")
    successOutAudio.current = new Audio("/sounds/success-out.mp3")
    errorAudio.current = new Audio("/sounds/error.mp3")
    enterCorrectAudio.current = new Audio("/sounds/enter_correct.mp3")
    exitCorrectAudio.current = new Audio("/sounds/exit_correct.mp3")

    // Clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === "loading" || status === "success") return

      if (e.key >= "0" && e.key <= "9") {
        handleNumberClick(e.key)
      } else if (e.key === "Backspace") {
        handleDelete()
      } else if (e.key === "Enter") {
        handleSubmit()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [pin, status])

  const handleNumberClick = (num: string) => {
    if (pin.length < 20) {
      setPin(prev => prev + num)
      setStatus("idle")
      setMessage("Introduce tu PIN")
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setStatus("idle")
  }

  const handleClear = () => {
    setPin("")
    setStatus("idle")
  }

  const handleSubmit = async () => {
    if (pin.length < 7) {
      setStatus("error")
      setMessage("El PIN debe tener al menos 7 dígitos")
      errorAudio.current?.play().catch(() => { })
      return
    }

    setStatus("loading")
    setMessage("Verificando...")

    try {
      const result = await verifyPin(pin)

      if (result.success) {
        setStatus("success")
        setLastResult(result)
        setPin("")

        // Play specific sound if provided, otherwise fallback to type-based
        if (result.sound === "enter_correct") {
          enterCorrectAudio.current?.play().catch(() => { })
        } else if (result.sound === "exit_correct") {
          exitCorrectAudio.current?.play().catch(() => { })
        } else if (result.sound === "error") {
          errorAudio.current?.play().catch(() => { })
        } else {
          // Fallback for generic success
          if (result.type === "IN") {
            successInAudio.current?.play().catch(() => { })
          } else {
            successOutAudio.current?.play().catch(() => { })
          }
        }

        // Reset after delay
        setTimeout(() => {
          setStatus("idle")
          setLastResult(null)
          setMessage("Introduce tu PIN")
        }, 4000)
      } else {
        setStatus("error")
        setMessage(result.message || "Error desconocido")
        errorAudio.current?.play().catch(() => { })
        setPin("")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error de conexión")
      errorAudio.current?.play().catch(() => { })
    }
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center transition-colors duration-500 relative overflow-hidden",
      status === "idle" && "bg-zinc-950",
      status === "loading" && "bg-blue-950",
      status === "success" && "bg-green-600",
      status === "error" && "bg-red-600"
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Admin Button */}
      <div className="absolute top-4 right-4 z-10">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
            <Settings className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 items-center z-10">

        {/* Left Column: Clock & Status */}
        <div className="flex flex-col items-center lg:items-start text-white space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-7xl font-bold tracking-tighter tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h2>
            <p className="text-2xl text-white/60 capitalize mt-2">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {status === "success" && lastResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center w-full border border-white/20"
              >
                <div className="text-6xl mb-4">
                  {lastResult.type === "IN" ? "👋" : "🏠"}
                </div>
                <h3 className="text-3xl font-bold mb-2">{lastResult.user?.name}</h3>
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-lg font-medium">
                  {lastResult.type === "IN" ? "ENTRADA" : "SALIDA"}
                  <span className="opacity-60">|</span>
                  {lastResult.timestamp}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center w-full border border-white/10"
              >
                <p className="text-xl font-medium text-white/80">{message}</p>
                {status === "error" && (
                  <p className="text-sm text-white/60 mt-2">Por favor, inténtalo de nuevo</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: PIN Pad */}
        <Card className="bg-zinc-900/90 border-zinc-800 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <div className="h-16 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center text-4xl font-mono tracking-[0.5em] text-white overflow-hidden">
              {pin.replace(/./g, "•") || <span className="text-zinc-700 tracking-normal text-sm">Introduce PIN</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-20 text-3xl font-bold bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
                onClick={() => handleNumberClick(num.toString())}
                disabled={status === "loading" || status === "success"}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="destructive"
              className="h-20 bg-red-900/30 border-red-900/50 hover:bg-red-900/50 text-red-500"
              onClick={handleClear}
              disabled={!pin || status === "loading" || status === "success"}
            >
              <X className="h-8 w-8" />
            </Button>
            <Button
              variant="outline"
              className="h-20 text-3xl font-bold bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
              onClick={() => handleNumberClick("0")}
              disabled={status === "loading" || status === "success"}
            >
              0
            </Button>
            <Button
              className={cn(
                "h-20 bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95",
                status === "loading" && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleSubmit}
              disabled={!pin || status === "loading" || status === "success"}
            >
              {status === "loading" ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="h-8 w-8" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
