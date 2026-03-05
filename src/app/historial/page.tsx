"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, Wallet, TrendingUp, Users, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { TrendChart } from "@/components/TrendChart";

type Pago = Database["public"]["Tables"]["registro_pagos"]["Row"] & {
    perfiles_alumnos: { nombre_completo: string } | null;
};

export default function HistorialPage() {
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadPagos() {
            const { data, error } = await supabase
                .from("registro_pagos")
                .select("*, perfiles_alumnos(nombre_completo)")
                .order("created_at", { ascending: false });

            if (data) setPagos(data as any);
            setLoading(false);
        }
        loadPagos();
    }, []);

    // Agrupar por mes para el resumen
    const resumenMensual = pagos.reduce((acc: any, pago) => {
        const mes = pago.mes_correspondiente;
        if (!acc[mes]) {
            acc[mes] = { mes, total: 0, alumnos: new Set() };
        }
        acc[mes].total += pago.monto;
        acc[mes].alumnos.add(pago.alumno_id);
        return acc;
    }, {});

    const resumenArray = Object.values(resumenMensual).sort((a: any, b: any) => {
        return b.mes.localeCompare(a.mes);
    });

    const filteredPagos = pagos.filter(pago =>
        pago.perfiles_alumnos?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pago.mes_correspondiente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Análisis Histórico</h1>
                    <p className="text-zinc-500 mt-1">Consulta la evolución de ingresos y registros de pagos pasados.</p>
                </div>

                {/* Mini Gráfico de Tendencia en el Header */}
                {!loading && resumenArray.length > 0 && (
                    <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl w-full md:w-64">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={14} className="text-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tendencia</span>
                        </div>
                        <TrendChart data={resumenArray as any} />
                    </div>
                )}
            </div>

            {/* Resumen de Meses */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="bg-zinc-950 border-zinc-900 animate-pulse">
                            <CardContent className="h-24" />
                        </Card>
                    ))
                ) : resumenArray.length === 0 ? (
                    <Card className="bg-zinc-950 border-zinc-900 md:col-span-3">
                        <CardContent className="py-10 text-center text-zinc-500">
                            No hay datos históricos registrados aún.
                        </CardContent>
                    </Card>
                ) : (
                    resumenArray.map((mes: any) => (
                        <Card key={mes.mes} className="bg-black border-zinc-900 hover:border-rose-500/50 transition-colors group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-bold text-zinc-400 group-hover:text-rose-500 transition-colors uppercase tracking-widest">
                                    {mes.mes}
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-rose-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{mes.total.toLocaleString()}€</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Users className="h-3 w-3 text-zinc-500" />
                                    <p className="text-xs text-zinc-500">
                                        {mes.alumnos.size} alumnos pagaron
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Buscador y Tabla de Pagos */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Buscador de Pagos</h2>
                    <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                        <TrendingUp size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Historial Completo</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2 bg-zinc-950 p-1 rounded-lg border border-zinc-900 max-w-md">
                    <Search className="h-5 w-5 text-zinc-500 ml-2" />
                    <Input
                        className="border-0 focus-visible:ring-0 shadow-none bg-transparent text-white"
                        placeholder="Buscar por nombre de alumno o mes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-zinc-900 bg-black overflow-hidden shadow-2xl">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/50">
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Alumno</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-center">Mes</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-right">Fecha Registro</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-right">Importe</TableHead>
                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-right">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-600" />
                                        <span className="text-zinc-500 mt-2 block">Cargando registros...</span>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPagos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-zinc-500">
                                        No se encontraron pagos con los criterios de búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPagos.map((pago: any) => (
                                    <TableRow key={pago.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-colors group">
                                        <TableCell className="font-medium text-white group-hover:text-rose-400 transition-colors">
                                            {pago.perfiles_alumnos?.nombre_completo || "Desconocido"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="border-zinc-800 text-zinc-400 font-normal">
                                                {pago.mes_correspondiente}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-zinc-500 text-xs">
                                            {pago.created_at ? new Date(pago.created_at).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-white">
                                            {pago.monto}€
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge className="bg-emerald-600/10 text-emerald-500 border-emerald-500/20">
                                                Completado
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
