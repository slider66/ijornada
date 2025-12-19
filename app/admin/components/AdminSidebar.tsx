"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, AlertCircle, Calendar, FileText, Home, Building } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { href: "/admin/workers", label: "Trabajadores", icon: Users },
    { href: "/admin/incidents", label: "Bajas y Faltas", icon: AlertCircle },
    { href: "/admin/schedules", label: "Horarios", icon: Calendar },
    { href: "/admin/company-closures", label: "Cierres Empresa", icon: Building },
    { href: "/admin/exports", label: "Informes", icon: FileText },
    { href: "/admin/holidays", label: "Festivos", icon: Calendar },
    { href: "/admin/settings", label: "Configuración", icon: Users },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-8">iJornada Admin</h2>
            <nav className="space-y-4 flex-1">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white visited:text-white hover:bg-blue-700"
                                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto pt-8 border-t border-slate-700">
                <Link
                    href="/"
                    className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                    <Home className="h-5 w-5" /> Home / Kiosk
                </Link>
            </div>
        </aside>
    );
}
