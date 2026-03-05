"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Users, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Historial", href: "/historial", icon: History },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-md text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-900 flex flex-col transition-transform duration-300 lg:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Section */}
                <div className="p-6 border-b border-zinc-900/50 flex items-center gap-3">
                    <div className="h-10 w-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/20">
                        <ShieldCheck className="text-white h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold leading-tight uppercase tracking-tighter">FightManager</h2>
                        <span className="text-rose-500 text-[10px] uppercase font-bold tracking-[0.2em] -mt-1 block">Pro MVP</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 mt-4">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-rose-600/10 text-rose-500"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                                )}
                            >
                                <item.icon size={20} className={cn(
                                    "transition-colors",
                                    isActive ? "text-rose-500" : "group-hover:text-white"
                                )} />
                                <span className="font-medium">{item.name}</span>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-600 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-zinc-900">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mb-4">
                        <p className="text-xs text-zinc-500 mb-2">Soporte Premium</p>
                        <Button className="w-full h-8 text-[11px] bg-rose-600/10 text-rose-500 border border-rose-600/20 hover:bg-rose-600 hover:text-white">
                            Ayuda & Guías
                        </Button>
                    </div>
                    <button className="flex items-center gap-3 px-4 py-2 w-full text-zinc-500 hover:text-white transition-colors text-sm">
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
