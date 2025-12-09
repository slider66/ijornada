"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Settings, Delete, Check, X, Barcode as BarcodeIcon, Keyboard } from "lucide-react"
import { verifyPin, verifyQr, type PinVerificationResult } from "./actions"
import { AnimatePresence, motion } from "framer-motion"
import { ScannerListener } from "@/components/kiosk/scanner-listener"
import { ScannerConfigDialog } from "@/components/kiosk/scanner-config-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function KioskPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle")
  const [message, setMessage] = useState("Introduce tu PIN o Escanea Código")
  const [pin, setPin] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastResult, setLastResult] = useState<PinVerificationResult | null>(null)
  const [activeTab, setActiveTab] = useState("pin")
  const [configOpen, setConfigOpen] = useState(false)

  // Audio refs
  const successInAudio = useRef<HTMLAudioElement | null>(null)
  const successOutAudio = useRef<HTMLAudioElement | null>(null)
  const errorAudio = useRef<HTMLAudioElement | null>(null)

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
    if (pin.length < 7) {
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

  // Handle physical keyboard input for PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === "loading" || status === "success" || activeTab !== "pin") return

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
  }, [pin, status, activeTab])

  const handleScan = async (token: string) => {
    if (status === "loading") return

    setStatus("loading")
    setMessage("Verificando Código...")

    try {
      const result = await verifyQr(token)
      processResult(result)
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

      <ScannerListener onScan={handleScan} isActive={activeTab === "qr" && !configOpen} />
      <ScannerConfigDialog open={configOpen} onOpenChange={setConfigOpen} />

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

        {/* Right Column: Input Method */}
        <Card className="bg-zinc-900/90 border-zinc-800 p-6 shadow-2xl backdrop-blur-xl w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pin">PIN</TabsTrigger>
              <TabsTrigger value="qr">Código de Barras</TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="mt-0">
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
            </TabsContent>

            <TabsContent value="qr" className="mt-0">
              <div className="flex flex-col items-center justify-center space-y-8 py-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                  <div className="relative bg-zinc-950 p-8 rounded-full border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <BarcodeIcon className="h-24 w-24 text-blue-500 animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">Escanea tu código</h3>
                  <p className="text-zinc-400">Acerca tu código de barras al lector</p>
                </div>

                <div className="pt-8 w-full">
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={() => setConfigOpen(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar / Probar Lector
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
