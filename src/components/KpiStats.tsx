import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Database } from "@/types/database.types";

type Alumno = Database["public"]["Tables"]["perfiles_alumnos"]["Row"];
type Pago = Database["public"]["Tables"]["registro_pagos"]["Row"];
type Gasto = Database["public"]["Tables"]["gastos"]["Row"];

interface KpiStatsProps {
    alumnos: Alumno[];
    pagos: Pago[];
    gastos: Gasto[];
}

export function KpiStats({ alumnos, pagos, gastos }: KpiStatsProps) {
    // 1. Recaudación Total (Ingresos)
    const recaudacionTotal = pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);

    // 2. Gastos Totales
    const gastosTotales = gastos.reduce((acc, g) => acc + (g.monto ?? 0), 0);

    // 3. Beneficio Neto
    const beneficioNeto = recaudacionTotal - gastosTotales;
    const isPositive = beneficioNeto >= 0;

    const stats = [
        {
            title: "Recaudación Total",
            value: `${recaudacionTotal.toLocaleString("es-ES")}€`,
            icon: TrendingUp,
            description: "Ingresos brutos del mes",
            iconColor: "text-emerald-500",
            bgClass: "bg-emerald-500/5 border-emerald-500/10",
        },
        {
            title: "Gastos Totales",
            value: `${gastosTotales.toLocaleString("es-ES")}€`,
            icon: TrendingDown,
            description: "Egresos registrados este mes",
            iconColor: "text-rose-500",
            bgClass: "bg-rose-500/5 border-rose-500/10",
        },
        {
            title: "Beneficio Neto",
            value: `${beneficioNeto.toLocaleString("es-ES")}€`,
            icon: DollarSign,
            description: isPositive ? "Margen de beneficio real" : "Balance negativo este mes",
            iconColor: isPositive ? "text-emerald-400" : "text-rose-600",
            valueColor: isPositive ? "text-emerald-400" : "text-rose-600",
            bgClass: isPositive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-3 mb-10">
            {stats.map((stat) => (
                <Card key={stat.title} className={`bg-black border-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] ${stat.bgClass}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-xl bg-black border border-zinc-900`}>
                            <stat.icon className={`h-4 w-4 ${stat.iconColor || "text-rose-500"}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-black italic ${stat.valueColor || "text-white"}`}>
                            {stat.value}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-tighter opacity-60">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
