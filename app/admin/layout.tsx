import { AdminSidebar } from "./components/AdminSidebar"
import { AdminInactivityHandler } from "./components/AdminInactivityHandler"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AdminInactivityHandler />
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
