"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, Wallet, TrendingUp, Users, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    const [selectedMes, setSelectedMes] = useState<string | null>(null);

    useEffect(() => {
        async function loadPagos() {
            setLoading(true);
            const { data, error } = await supabase
                .from("registro_pagos")
                .select("*, perfiles_alumnos(nombre_completo)")
                .order("fecha_pago", { ascending: false });

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
        acc[mes].total += Number(pago.monto);
        acc[mes].alumnos.add(pago.alumno_id);
        return acc;
    }, {});

    const resumenArray = Object.values(resumenMensual).sort((a: any, b: any) => {
        return b.mes.localeCompare(a.mes);
    });

    const filteredPagos = pagos.filter(pago => {
        const matchesSearch = pago.perfiles_alumnos?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pago.mes_correspondiente.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMes = !selectedMes || pago.mes_correspondiente === selectedMes;
        return matchesSearch && matchesMes;
    });

    const exportToCsv = () => {
        const headers = ["Alumno", "Mes Correspondiente", "Monto", "Fecha Registro"];
        const rows = filteredPagos.map((pago: any) => [
            pago.perfiles_alumnos?.nombre_completo || "Desconocido",
            pago.mes_correspondiente,
            `${pago.monto}€`,
            pago.created_at ? new Date(pago.created_at).toLocaleDateString() : "-"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pagos_fightmanager_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header Profesional con Exportación y Gráfico */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 bg-zinc-950/30 p-8 rounded-3xl border border-zinc-900 shadow-2xl">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-1.5 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
                                ANÁLISIS <span className="text-rose-600">HISTÓRICO</span>
                            </h1>
                            <p className="text-zinc-500 font-medium mt-1">Control de ingresos y registros de mensualidades pasadas.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Button
                        onClick={exportToCsv}
                        variant="outline"
                        className="w-full sm:w-auto bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-rose-600 h-12 px-8 rounded-2xl transition-all shadow-lg hover:shadow-rose-600/10 active:scale-95"
                    >
                        Exportar CSV
                    </Button>

                    {!loading && resumenArray.length > 0 && (
                        <div className="bg-black border border-zinc-800 p-5 rounded-3xl w-full sm:w-72 shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={14} className="text-rose-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tendencia</span>
                                </div>
                                <span className="text-[10px] text-zinc-600 group-hover:text-rose-500 transition-colors">Últimos meses</span>
                            </div>
                            <TrendChart data={resumenArray as any} />
                        </div>
                    )}
                </div>
            </div>

            {/* Grid de Resumen por Meses */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-rose-600" size={20} />
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-widest text-sm">Resumen Mensual</h2>
                    </div>
                    {selectedMes && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMes(null)}
                            className="text-zinc-500 hover:text-rose-500 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Ver Todos los Registros
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="bg-zinc-950/50 border-zinc-900 animate-pulse rounded-2xl">
                                <CardContent className="h-32" />
                            </Card>
                        ))
                    ) : resumenArray.length === 0 ? (
                        <Card className="bg-zinc-950/50 border-zinc-900 col-span-full rounded-2xl border-dashed">
                            <CardContent className="py-16 text-center text-zinc-500">
                                No hay datos históricos registrados aún.
                            </CardContent>
                        </Card>
                    ) : (
                        resumenArray.map((mes: any) => (
                            <Card
                                key={mes.mes}
                                onClick={() => setSelectedMes(mes.mes === selectedMes ? null : mes.mes)}
                                className={`bg-black transition-all duration-300 group rounded-2xl shadow-xl cursor-pointer ${selectedMes === mes.mes ? "border-rose-600 ring-1 ring-rose-600/50 scale-[1.02]" : "border-zinc-900 hover:border-rose-500/50 hover:-translate-y-1"}`}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className={`text-xs font-bold uppercase tracking-widest transition-colors ${selectedMes === mes.mes ? "text-rose-500" : "text-zinc-500 group-hover:text-rose-500"}`}>
                                        {mes.mes}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg transition-colors ${selectedMes === mes.mes ? "bg-rose-600/20" : "bg-zinc-900 group-hover:bg-rose-600/10"}`}>
                                        <Calendar className={`h-4 w-4 ${selectedMes === mes.mes ? "text-rose-500" : "text-zinc-600 group-hover:text-rose-600"}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-white italic">{mes.total.toLocaleString()}€</div>
                                    <div className="flex items-center gap-2 mt-3 bg-zinc-950 p-2 rounded-xl border border-zinc-900">
                                        <Users className="h-3.5 w-3.5 text-zinc-500" />
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                            {mes.alumnos.size} alumnos pagaron
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Buscador y Tabla de Pagos Detallada */}
            <div className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-white tracking-tight italic uppercase">
                            Registro <span className="text-rose-600">{selectedMes ? selectedMes : "Global"}</span>
                        </h2>
                        <p className="text-zinc-500 text-sm">
                            {selectedMes ? `Mostrando pagos registrados para ${selectedMes}.` : "Listado detallado de todas las transacciones históricas."}
                        </p>
                    </div>

                    <div className="flex items-center space-x-3 bg-black p-1.5 pl-4 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl">
                        <Search className="h-5 w-5 text-zinc-600" />
                        <Input
                            className="border-0 focus-visible:ring-0 shadow-none bg-transparent text-white placeholder:text-zinc-700"
                            placeholder="Buscar por nombre o mes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-3xl border border-zinc-900 bg-black overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-6 py-5">Alumno</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-center">Mes</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right">Fecha Registro</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right px-6">Importe</TableHead>
                                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right px-6">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-32">
                                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-rose-600" />
                                        <span className="text-zinc-600 mt-4 block font-bold text-xs uppercase tracking-widest">Sincronizando registros...</span>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPagos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-32 text-zinc-600 font-medium">
                                        No se encontraron registros para esta búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPagos.map((pago: any) => (
                                    <TableRow key={pago.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all group">
                                        <TableCell className="font-semibold text-white group-hover:text-rose-500 transition-colors px-6 py-4">
                                            {pago.perfiles_alumnos?.nombre_completo || "Desconocido"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-normal bg-zinc-950/50">
                                                {pago.mes_correspondiente}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-zinc-600 text-xs font-mono">
                                            {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-white px-6">
                                            {pago.monto}€
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Verificado</span>
                                            </div>
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
