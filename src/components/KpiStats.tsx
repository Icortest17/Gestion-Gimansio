import { Users, Wallet, TrendingDown } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Database } from "@/types/database.types";

type Alumno = Database["public"]["Tables"]["perfiles_alumnos"]["Row"];
type Pago = Database["public"]["Tables"]["registro_pagos"]["Row"];

interface KpiStatsProps {
    alumnos: Alumno[];
    pagos: Pago[];
}

export function KpiStats({ alumnos, pagos }: KpiStatsProps) {
    // 1. Total Alumnos
    const totalAlumnos = alumnos.length;

    // 2. Recaudación del Mes
    const recaudacionTotal = pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);

    // 3. Pendiente de Cobro
    const paidAlumnoIds = new Set(pagos.map((p) => p.alumno_id));
    const pendienteCobro = alumnos
        .filter((a) => !paidAlumnoIds.has(a.id))
        .reduce((acc, a) => acc + (a.precio_mensual ?? 0), 0);

    const stats = [
        {
            title: "Total Alumnos",
            value: totalAlumnos.toString(),
            icon: Users,
            description: "Alumnos registrados",
        },
        {
            title: "Recaudación del Mes",
            value: `${recaudacionTotal.toLocaleString("es-ES")}€`,
            icon: Wallet,
            description: "Pagos registrados este mes",
        },
        {
            title: "Pendiente de Cobro",
            value: `${pendienteCobro.toLocaleString("es-ES")}€`,
            icon: TrendingDown,
            description: "Alumnos con pago pendiente",
            iconColor: "text-red-500",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
            {stats.map((stat) => (
                <Card key={stat.title} className="bg-black border-zinc-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.iconColor || "text-rose-500"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <p className="text-xs text-zinc-500 mt-1">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
