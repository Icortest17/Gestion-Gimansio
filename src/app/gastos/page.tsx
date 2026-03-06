"use client";

import { useState, useEffect } from "react";
import { TrendingDown, Plus, Trash, Loader2, DollarSign, Calendar, Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type Gasto = Database["public"]["Tables"]["gastos"]["Row"];

export default function GastosPage() {
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [descripcion, setDescripcion] = useState("");
    const [monto, setMonto] = useState("");
    const [categoria, setCategoria] = useState("Fijo");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadGastos();
    }, []);

    async function loadGastos() {
        setLoading(true);
        const { data, error } = await supabase
            .from("gastos")
            .select("*")
            .order("fecha_gasto", { ascending: false });

        if (data) setGastos(data);
        setLoading(false);
    }

    async function handleAddGasto(e: React.FormEvent) {
        e.preventDefault();
        if (!descripcion || !monto) return;

        setIsSubmitting(true);
        const { error } = await supabase
            .from("gastos")
            .insert([{
                descripcion,
                monto: parseFloat(monto),
                categoria,
                fecha_gasto: fecha
            }]);

        if (!error) {
            setDescripcion("");
            setMonto("");
            loadGastos();
        }
        setIsSubmitting(false);
    }

    async function handleDeleteGasto(id: string) {
        if (!confirm("¿Eliminar este registro de gasto?")) return;

        const { error } = await supabase
            .from("gastos")
            .delete()
            .eq("id", id);

        if (!error) {
            loadGastos();
        }
    }

    const totalGastosMes = gastos.reduce((acc, curr) => acc + curr.monto, 0);

    const exportToCsv = () => {
        const headers = ["Descripción", "Categoría", "Monto", "Fecha"];
        const rows = gastos.map(g => [
            g.descripcion,
            g.categoria,
            `${g.monto}€`,
            g.fecha_gasto
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `gastos_fightmanager_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                        Control de <span className="text-rose-600">Gastos</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">Gestiona las salidas de capital y gastos operativos.</p>
                </div>

                <div className="flex items-center gap-4">
                    <Card className="bg-zinc-950 border-zinc-900 px-6 py-4 rounded-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingDown size={40} className="text-rose-600" />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Gastos Gral.</p>
                        <div className="text-3xl font-black text-white italic">{totalGastosMes.toLocaleString()}€</div>
                    </Card>
                    <Button
                        onClick={exportToCsv}
                        variant="outline"
                        className="bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-rose-600 h-16 px-6 rounded-3xl font-bold uppercase text-[10px] tracking-widest flex flex-col items-center justify-center gap-1 group transition-all"
                    >
                        <FileText size={18} className="group-hover:scale-110 transition-transform" />
                        <span>Exportar</span>
                    </Button>
                </div>
            </div>

            {/* Formulario y Tabla */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Formulario Lateral */}
                <div className="lg:col-span-4">
                    <Card className="bg-zinc-950 border-zinc-900 rounded-3xl sticky top-8 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                <Plus size={14} className="text-rose-600" />
                                Registrar Nuevo Gasto
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddGasto} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Descripción</label>
                                    <Input
                                        placeholder="Ej: Alquiler Local Marzo"
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        className="bg-black border-zinc-800 text-white rounded-xl focus:border-rose-600 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Monto (€)</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={monto}
                                            onChange={(e) => setMonto(e.target.value)}
                                            className="bg-black border-zinc-800 text-white rounded-xl focus:border-rose-600 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Fecha</label>
                                        <Input
                                            type="date"
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                            className="bg-black border-zinc-800 text-white rounded-xl focus:border-rose-600 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Categoría</label>
                                    <Select value={categoria} onValueChange={setCategoria}>
                                        <SelectTrigger className="bg-black border-zinc-800 text-white rounded-xl focus:ring-rose-600 transition-colors">
                                            <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                            <SelectItem value="Alquiler">Alquiler</SelectItem>
                                            <SelectItem value="Luz">Luz</SelectItem>
                                            <SelectItem value="Material">Material</SelectItem>
                                            <SelectItem value="Sueldos">Sueldos</SelectItem>
                                            <SelectItem value="Fijo">Fijo</SelectItem>
                                            <SelectItem value="Suministros">Suministros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white h-12 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-rose-600/20 mt-4 h-14"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Guardar Registro"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabla de Gastos */}
                <div className="lg:col-span-8">
                    <div className="rounded-3xl border border-zinc-900 bg-black overflow-hidden shadow-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-8 py-5">Concepto</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-center">Categoría</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-center">Fecha</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right px-8">Monto</TableHead>
                                    <TableHead className="w-[80px] px-4"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <Loader2 className="animate-spin h-8 w-8 mx-auto text-rose-600 mb-4" />
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sincronizando finanzas...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : gastos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <p className="text-sm italic text-zinc-600">No hay gastos registrados en este periodo.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    gastos.map((gasto) => (
                                        <TableRow key={gasto.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all group">
                                            <TableCell className="px-8 py-5">
                                                <div className="font-bold text-white group-hover:text-rose-500 transition-colors uppercase italic">{gasto.descripcion}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[9px] font-bold text-zinc-400 group-hover:border-rose-500/30 group-hover:text-zinc-300 transition-all">
                                                    {gasto.categoria}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-zinc-500 text-xs font-mono italic">
                                                {gasto.fecha_gasto}
                                            </TableCell>
                                            <TableCell className="text-right px-8 font-black text-rose-500 text-lg italic">
                                                -{gasto.monto}€
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteGasto(gasto.id)}
                                                    className="text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <Trash size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
