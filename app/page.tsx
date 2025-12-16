"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Settings, Check, X, Barcode as BarcodeIcon } from "lucide-react"
import { verifyPin, verifyQr, type PinVerificationResult } from "./actions"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"

export default function KioskPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [message, setMessage] = useState("Introduce tu PIN o Escanea Código")
  const [pin, setPin] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastResult, setLastResult] = useState<PinVerificationResult | null>(null)

  // Audio refs
  const successInAudio = useRef<HTMLAudioElement | null>(null)
  const successOutAudio = useRef<HTMLAudioElement | null>(null)
  const errorAudio = useRef<HTMLAudioElement | null>(null)

  // Scanner refs
  const buffer = useRef<string>("")
  const lastKeyTime = useRef<number>(0)

  useEffect(() => {
    successInAudio.current = new Audio("/sounds/success-in.mp3")
    successOutAudio.current = new Audio("/sounds/success-out.mp3")
    errorAudio.current = new Audio("/sounds/error.mp3")

    // Clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleNumberClick = (num: string) => {
    if (pin.length < 20) {
      setPin(prev => prev + num)
      if (status !== "success") {
        setStatus("idle")
        setMessage("Introduce tu PIN o Escanea Código")
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    if (status !== "success") setStatus("idle")
  }

  const handleClear = () => {
    setPin("")
    if (status !== "success") setStatus("idle")
  }

  const processResult = (result: PinVerificationResult) => {
    if (result.success) {
      setStatus("success")
      setLastResult(result)
      setPin("")

      if (result.type === "IN") {
        successInAudio.current?.play().catch(() => { })
      } else {
        successOutAudio.current?.play().catch(() => { })
      }

      // Reset after delay
      setTimeout(() => {
        setStatus("idle")
        setLastResult(null)
        setMessage("Introduce tu PIN o Escanea Código")
      }, 4000)
    } else {
      setStatus("error")
      setMessage(result.message || "Error desconocido")
      errorAudio.current?.play().catch(() => { })
      setPin("")
    }
  }

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setStatus("error")
      setMessage("El PIN debe tener al menos 4 dígitos")
      errorAudio.current?.play().catch(() => { })
      return
    }

    setStatus("loading")
    setMessage("Verificando PIN...")

    try {
      const result = await verifyPin(pin)
      processResult(result)
    } catch (error) {
      setStatus("error")
      setMessage("Error de conexión")
      errorAudio.current?.play().catch(() => { })
    }
  }

  const handleScan = async (token: string) => {
    if (status === "loading") return

    setStatus("loading")
    setMessage("Verificando Código...")
    setPin("") // Clear any partial PIN input that might have occurred during scanning

    try {
      const result = await verifyQr(token)
      processResult(result)
    } catch (error) {
      setStatus("error")
      setMessage("Error de conexión")
      errorAudio.current?.play().catch(() => { })
    }
  }

  // Unified Keyboard Listener (PIN + Scanner)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if status is loading or success (unless it's just idle/error)
      if (status === "loading" || status === "success") return

      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime.current

      // Update last key time
      lastKeyTime.current = currentTime

      // Scanner Logic: Differentiate based on timing
      // Scanners are usually < 50ms per key. Manual typing is usually > 100ms.
      // We use 100ms as a safe threshold.
      if (timeDiff > 100) {
        buffer.current = "" // Reset buffer if slow (manual typing)
      }

      if (e.key === "Enter") {
        // If buffer has content that looks like a barcode (e.g., > 5 chars), treat as scan
        if (buffer.current.length > 5) {
          e.preventDefault()
          const token = buffer.current
          handleScan(token)
          buffer.current = ""
          return
        }

        // Otherwise, treat as manual Enter key
        if (buffer.current.length === 0 && pin.length >= 4) {
          handleSubmit()
        }
        buffer.current = ""
      } else if (e.key.length === 1 && /[\w\d]/.test(e.key)) {
        // Printable chars add to scanner buffer
        buffer.current += e.key

        // ALSO add to PIN if it looks like a number (so manual typing works)
        // But if it's part of a scan, it will also be added here.
        // We accept this visual side-effect as it makes "indistinct" usage easier.
        // The fast typing will just fill the PIN box temporarily.
        if (e.key >= "0" && e.key <= "9") {
          handleNumberClick(e.key)
        }
      } else if (e.key === "Backspace") {
        handleDelete()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [pin, status]) // Deps needed for PIN state access inside effect if needed, but strict mode might be tricky.
  // Actually, we use functional state updates for setPin, so we might not need 'pin' in deps for that.
  // BUT we need 'pin' in deps because we check `pin.length` in Enter case.


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

        {/* Right Column: Keypad (Always visible now) */}
        <Card className="bg-zinc-900/90 border-zinc-800 p-6 shadow-2xl backdrop-blur-xl w-full">
          <div className="mb-6">
            <div className="h-16 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center text-4xl font-mono tracking-[0.5em] text-white overflow-hidden relative">
              {pin.replace(/./g, "•") || (
                <div className="flex items-center gap-2 text-zinc-700 tracking-normal text-sm animate-pulse">
                  <BarcodeIcon className="w-4 h-4" />
                  <span>PIN o Escáner</span>
                </div>
              )}
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

          <div className="mt-4 text-center">
            <p className="text-xs text-zinc-600">
              Puedes escribir tu PIN o usar el lector de códigos en cualquier momento.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
