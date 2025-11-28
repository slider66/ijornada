import Link from "next/link"
import { Users, AlertCircle, Calendar, FileText, Home } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8">iJornada Admin</h2>
        <nav className="space-y-4 flex-1">
          <Link href="/admin/workers" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded">
            <Users className="h-5 w-5" /> Trabajadores
          </Link>
          <Link href="/admin/incidents" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded">
            <AlertCircle className="h-5 w-5" /> Bajas y Faltas
          </Link>
          <Link href="/admin/schedules" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded">
            <Calendar className="h-5 w-5" /> Horarios
          </Link>
          <Link href="/admin/exports" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded">
            <FileText className="h-5 w-5" /> Informes
          </Link>
        </nav>
        <div className="mt-auto pt-8 border-t border-slate-700">
          <Link href="/kiosk" className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded text-slate-400">
            <Home className="h-5 w-5" /> Volver al Kiosco
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
