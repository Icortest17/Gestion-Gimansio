"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, Wallet, TrendingUp, TrendingDown, Users, Loader2, DollarSign, FileText } from "lucide-react";
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

type Gasto = Database["public"]["Tables"]["gastos"]["Row"];

export default function HistorialPage() {
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMes, setSelectedMes] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { data: pagosData } = await supabase
                .from("registro_pagos")
                .select("*, perfiles_alumnos(nombre_completo)")
                .order("fecha_pago", { ascending: false });

            const { data: gastosData } = await supabase
                .from("gastos")
                .select("*")
                .order("fecha_gasto", { ascending: false });

            if (pagosData) setPagos(pagosData as any);
            if (gastosData) setGastos(gastosData);
            setLoading(false);
        }
        loadData();
    }, []);

    // Función auxiliar para obtener el mes de un gasto (YYYY-MM-DD -> "Mes Año")
    const getMesFromGasto = (fecha: string | null) => {
        if (!fecha) return "Desconocido";
        const meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const date = new Date(fecha);
        return `${meses[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Agrupar por mes para el resumen consolidado
    const resumenMensual = pagos.reduce((acc: any, pago) => {
        const mes = pago.mes_correspondiente;
        if (!acc[mes]) {
            acc[mes] = { mes, ingresos: 0, gastos: 0, balance: 0, alumnos: new Set() };
        }
        acc[mes].ingresos += Number(pago.monto);
        acc[mes].alumnos.add(pago.alumno_id);
        return acc;
    }, {});

    // Añadir gastos al resumen mensual
    gastos.forEach(gasto => {
        const mes = getMesFromGasto(gasto.fecha_gasto);
        if (!resumenMensual[mes]) {
            resumenMensual[mes] = { mes, ingresos: 0, gastos: 0, balance: 0, alumnos: new Set() };
        }
        resumenMensual[mes].gastos += Number(gasto.monto);
    });

    // Calcular balance final
    Object.values(resumenMensual).forEach((res: any) => {
        res.balance = res.ingresos - res.gastos;
    });

    const resumenArray = Object.values(resumenMensual).sort((a: any, b: any) => {
        // Ordenar por fecha real (Marzo 2024 vs Febrero 2024)
        const getVal = (m: string) => {
            const [mes, año] = m.split(" ");
            const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            return parseInt(año) * 100 + meses.indexOf(mes);
        };
        return getVal(b.mes) - getVal(a.mes);
    });

    const filteredPagos = pagos.filter(pago => {
        const matchesSearch = pago.perfiles_alumnos?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pago.mes_correspondiente.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMes = !selectedMes || pago.mes_correspondiente === selectedMes;
        return matchesSearch && matchesMes;
    });

    const filteredGastos = gastos.filter(gasto => {
        const mesGasto = getMesFromGasto(gasto.fecha_gasto);
        const matchesSearch = gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mesGasto.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMes = !selectedMes || mesGasto === selectedMes;
        return matchesSearch && matchesMes;
    });

    const exportToCsv = () => {
        const headers = ["Tipo", "Concepto", "Mes/Fecha", "Monto"];
        const rowsPagos = filteredPagos.map((pago: any) => [
            "INGRESO",
            pago.perfiles_alumnos?.nombre_completo || "S/N",
            pago.mes_correspondiente,
            `${pago.monto}€`
        ]);
        const rowsGastos = filteredGastos.map((gasto: any) => [
            "GASTO",
            gasto.descripcion,
            gasto.fecha_gasto,
            `-${gasto.monto}€`
        ]);

        const csvContent = [headers, ...rowsPagos, ...rowsGastos].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_consolidado_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const statsMes = selectedMes ? resumenMensual[selectedMes] : {
        ingresos: resumenArray.reduce((acc, r: any) => acc + r.ingresos, 0),
        gastos: resumenArray.reduce((acc, r: any) => acc + r.gastos, 0),
        balance: resumenArray.reduce((acc, r: any) => acc + r.balance, 0)
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header Profesional */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 bg-zinc-950/30 p-8 rounded-3xl border border-zinc-900 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <DollarSign size={200} className="text-white" />
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-1.5 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
                                BALANCE <span className="text-rose-600">CONSOLIDADO</span>
                            </h1>
                            <p className="text-zinc-500 font-medium mt-1">Histórico real de ingresos brutos vs gastos operativos.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        <div className="bg-black/40 border border-zinc-900 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Ingresos Brutos</p>
                            <p className="text-2xl font-black text-emerald-500">{statsMes.ingresos.toLocaleString()}€</p>
                        </div>
                        <div className="bg-black/40 border border-zinc-900 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Gastos Operativos</p>
                            <p className="text-2xl font-black text-rose-500 italic">-{statsMes.gastos.toLocaleString()}€</p>
                        </div>
                        <div className={`col-span-2 lg:col-span-1 p-4 rounded-2xl border ${statsMes.balance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Beneficio Neto Real</p>
                            <p className={`text-2xl font-black italic ${statsMes.balance >= 0 ? 'text-emerald-400' : 'text-rose-600'}`}>{statsMes.balance.toLocaleString()}€</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Button
                        onClick={exportToCsv}
                        variant="outline"
                        className="w-full sm:w-auto bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-rose-600 h-12 px-8 rounded-2xl transition-all shadow-lg hover:shadow-rose-600/10"
                    >
                        <FileText className="mr-2 h-4 w-4" /> Exportar Reporte
                    </Button>

                    {!loading && resumenArray.length > 0 && (
                        <div className="bg-black border border-zinc-800 p-5 rounded-3xl w-full sm:w-72 shadow-2xl relative overflow-hidden group">
                            <TrendChart data={resumenArray.map((r: any) => ({ mes: r.mes, total: r.balance })) as any} />
                        </div>
                    )}
                </div>
            </div>

            {/* Grid de Meses Consolidados */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-rose-600" size={20} />
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-widest text-sm italic">Evolución Mensual</h2>
                    </div>
                    {selectedMes && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMes(null)}
                            className="text-zinc-500 hover:text-rose-500 text-[10px] font-bold uppercase tracking-widest border border-zinc-900 rounded-full px-4"
                        >
                            Ver Balance Global
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="bg-zinc-950/50 border-zinc-900 animate-pulse rounded-2xl h-40" />
                        ))
                    ) : (
                        resumenArray.map((mes: any) => (
                            <Card
                                key={mes.mes}
                                onClick={() => setSelectedMes(mes.mes === selectedMes ? null : mes.mes)}
                                className={`bg-black transition-all duration-300 group rounded-3xl shadow-xl cursor-pointer ${selectedMes === mes.mes ? "border-rose-600 ring-2 ring-rose-600/20 scale-[1.02]" : "border-zinc-900 hover:border-rose-500/50 hover:-translate-y-1"}`}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${selectedMes === mes.mes ? "text-rose-500" : "text-zinc-500 group-hover:text-rose-500"}`}>
                                        {mes.mes}
                                    </CardTitle>
                                    <div className={`p-1.5 rounded-lg transition-colors ${selectedMes === mes.mes ? "bg-rose-600/20 text-rose-500" : "bg-zinc-900 text-zinc-600 group-hover:text-rose-600"}`}>
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className={`text-2xl font-black italic transition-colors ${mes.balance >= 0 ? (selectedMes === mes.mes ? 'text-emerald-400' : 'text-white') : 'text-rose-600'}`}>
                                        {mes.balance.toLocaleString()}€
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <div className="text-[9px] font-bold text-zinc-600 uppercase">IN: <span className="text-emerald-500/70">{mes.ingresos}€</span></div>
                                        <div className="text-[9px] font-bold text-zinc-600 uppercase">OUT: <span className="text-rose-500/70">{mes.gastos}€</span></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Listado Consolidado */}
            <div className="grid lg:grid-cols-2 gap-8 pt-4">
                {/* Tabla de Ingresos */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-4">
                        <TrendingUp className="text-emerald-500 h-5 w-5" />
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs italic">Ingresos por Cuotas</h3>
                    </div>
                    <div className="rounded-3xl border border-zinc-900 bg-black/50 overflow-hidden shadow-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest py-4">Alumno</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-right px-6">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPagos.slice(0, 10).map((pago: any) => (
                                    <TableRow key={pago.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all">
                                        <TableCell className="font-bold text-white uppercase text-[10px] tracking-tighter py-3 pl-6">
                                            {pago.perfiles_alumnos?.nombre_completo || "S/N"}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-emerald-500 italic pr-6 text-sm">
                                            +{pago.monto}€
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Tabla de Gastos */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-4">
                        <TrendingDown className="text-rose-500 h-5 w-5" />
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs italic">Gastos Operativos</h3>
                    </div>
                    <div className="rounded-3xl border border-zinc-900 bg-black/50 overflow-hidden shadow-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest py-4">Concepto</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-right px-6">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGastos.slice(0, 10).map((gasto: any) => (
                                    <TableRow key={gasto.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all">
                                        <TableCell className="font-bold text-white uppercase text-[10px] tracking-tighter py-3 pl-6">
                                            {gasto.descripcion}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-rose-500 italic pr-6 text-sm">
                                            -{gasto.monto}€
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredGastos.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="py-10 text-center text-zinc-600 italic text-xs">Sin gastos registrados para este periodo.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
