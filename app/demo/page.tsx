"use client";

import * as React from "react";
import { AlertToast } from "@/components/ui/alert-toast";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, LogOut, User, Clock } from "lucide-react";
import FlipClock from "@/components/ui/flip-clock";

interface Alert {
  id: number | string;
  variant: "success" | "warning" | "info" | "error";
  title: string;
  description: string;
  styleVariant: "default" | "filled";
}

export default function DemoPage() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const addAlert = (type: "in" | "out") => {
    const id = Date.now();
    const isEntry = type === "in";

    const newAlert: Alert = {
      id,
      variant: "success",
      styleVariant: "filled",
      title: isEntry ? "¡Bienvenido/a!" : "¡Hasta pronto!",
      description: isEntry
        ? `Entrada registrada correctamente a las ${new Date().toLocaleTimeString()}`
        : `Salida registrada correctamente a las ${new Date().toLocaleTimeString()}`,
    };

    setAlerts((prev) => [newAlert, ...prev].slice(0, 3)); // Keep max 3 alerts

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
  };

  const handleClose = (id: number | string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-white selection:bg-blue-500/30">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950" />

      {/* Content Container */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">

        {/* Header / Clock */}
        <div className="mb-12 flex flex-col items-center space-y-6">
          <div className="rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
            Modo Demostración
          </div>
          <div className="scale-75 sm:scale-100">
            <FlipClock />
          </div>
          <p className="text-zinc-400">Seleccione una acción para registrar su jornada</p>
        </div>

        {/* Action Buttons */}
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addAlert("in")}
            className="group relative flex h-48 flex-col items-center justify-center space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-colors hover:border-green-500/50 hover:bg-green-950/10"
          >
            <div className="rounded-full bg-green-500/10 p-4 ring-1 ring-green-500/20 transition-colors group-hover:bg-green-500/20 group-hover:ring-green-500/40">
              <LogIn className="h-10 w-10 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-zinc-100 group-hover:text-green-400">Entrada</h3>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Registrar inicio de jornada</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addAlert("out")}
            className="group relative flex h-48 flex-col items-center justify-center space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-colors hover:border-orange-500/50 hover:bg-orange-950/10"
          >
            <div className="rounded-full bg-orange-500/10 p-4 ring-1 ring-orange-500/20 transition-colors group-hover:bg-orange-500/20 group-hover:ring-orange-500/40">
              <LogOut className="h-10 w-10 text-orange-500" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-zinc-100 group-hover:text-orange-400">Salida</h3>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Registrar fin de jornada</p>
            </div>
          </motion.button>
        </div>

        {/* User Info Mockup */}
        <div className="mt-12 flex items-center space-x-4 rounded-full border border-zinc-800 bg-zinc-900/50 px-6 py-3 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200">Empleado de Ejemplo</span>
            <span className="text-xs text-zinc-500">ID: #DEMO-001</span>
          </div>
        </div>

        {/* Notifications Area */}
        <div className="fixed bottom-8 right-8 z-50 flex w-full max-w-sm flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => (
              <AlertToast
                key={alert.id}
                variant={alert.variant}
                styleVariant={alert.styleVariant}
                title={alert.title}
                description={alert.description}
                onClose={() => handleClose(alert.id)}
                className="shadow-2xl backdrop-blur-md"
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
