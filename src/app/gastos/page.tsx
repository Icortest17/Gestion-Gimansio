"use client";

import { useState, useEffect } from "react";
import { TrendingDown, Plus, Trash, Loader2, DollarSign, Calendar, Search, FileText, Settings2, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { getMesActual, getStartAndEndOfMonth, generateListMonths } from "@/lib/utils-pagos";

type Gasto = Database["public"]["Tables"]["gastos"]["Row"];
type GastoFijo = Database["public"]["Tables"]["gastos_fijos"]["Row"];

export default function GastosPage() {
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state (Gasto único)
    const [descripcion, setDescripcion] = useState("");
    const [monto, setMonto] = useState("");
    const [categoria, setCategoria] = useState("Fijo");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    // Form state (Gasto Fijo)
    const [descFijo, setDescFijo] = useState("");
    const [montoFijo, setMontoFijo] = useState("");
    const [catFijo, setCatFijo] = useState("Fijo");
    const [aplicarAhora, setAplicarAhora] = useState("no");

    const [mesActualStr, setMesActualStr] = useState<string>(getMesActual());
    const mesesDisponibles = generateListMonths();

    useEffect(() => {
        loadData();
    }, [mesActualStr]);

    async function loadData() {
        setLoading(true);
        const { start: startOfMonthStr, end: endOfMonthStr } = getStartAndEndOfMonth(mesActualStr);

        const { data: gData } = await supabase
            .from("gastos")
            .select("*")
            .gte("fecha_gasto", startOfMonthStr)
            .lte("fecha_gasto", endOfMonthStr)
            .order("fecha_gasto", { ascending: false });

        const { data: fData } = await supabase
            .from("gastos_fijos")
            .select("*")
            .order("created_at", { ascending: false });

        if (gData) setGastos(gData);
        if (fData) setGastosFijos(fData);
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
            loadData();
        }
        setIsSubmitting(false);
    }

    async function handleAddGastoFijo(e: React.FormEvent) {
        e.preventDefault();
        if (!descFijo || !montoFijo) return;

        setIsSubmitting(true);

        // 1. Crear la plantilla fija
        const { data: nuevoFijo, error: fijoError } = await supabase
            .from("gastos_fijos")
            .insert([{
                descripcion: descFijo,
                monto: parseFloat(montoFijo),
                categoria: catFijo
            }])
            .select()
            .single();

        if (fijoError) {
            setIsSubmitting(false);
            return;
        }

        // 2. Si el usuario quiere aplicarlo ahora al mes actual
        if (aplicarAhora === "si" && nuevoFijo) {
            await supabase
                .from("gastos")
                .insert([{
                    descripcion: descFijo,
                    monto: parseFloat(montoFijo),
                    categoria: catFijo,
                    fecha_gasto: new Date().toISOString().split('T')[0],
                    origen_fijo_id: nuevoFijo.id
                }]);
        }

        setDescFijo("");
        setMontoFijo("");
        setAplicarAhora("no");
        loadData();
        setIsSubmitting(false);
    }

    async function handleDeleteGasto(id: string) {
        if (!confirm("¿Eliminar este registro de gasto?")) return;
        const { error } = await supabase.from("gastos").delete().eq("id", id);
        if (!error) loadData();
    }

    async function handleDeleteGastoFijo(id: string) {
        if (!confirm("¿Eliminar esta plantilla de gasto fijo? Se dejará de aplicar en los próximos meses.")) return;
        const { error } = await supabase.from("gastos_fijos").delete().eq("id", id);
        if (!error) loadData();
    }

    const totalGastosMes = gastos.reduce((acc, curr) => acc + curr.monto, 0);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Profesional */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1 flex-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex flex-col md:flex-row md:items-center gap-4">
                        <span>Finanzas <span className="text-rose-600">Pro</span></span>
                        <Select value={mesActualStr} onValueChange={setMesActualStr}>
                            <SelectTrigger className="w-[200px] h-10 bg-zinc-900/50 border-zinc-800 text-rose-500 font-bold italic rounded-xl focus:ring-rose-500 transition-colors text-base normal-case tracking-normal">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                {mesesDisponibles.map(mes => (
                                    <SelectItem key={mes} value={mes} className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2 font-sans not-italic">
                                        {mes} {mes === getMesActual() && "(Mes Actual)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">Control integral de salidas, gastos fijos y automatización.</p>
                </div>

                <Card className="bg-zinc-950 border-zinc-900 px-8 py-5 rounded-3xl shadow-2xl relative overflow-hidden group min-w-[240px]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingDown size={50} className="text-rose-600" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 italic">Gastos de {mesActualStr}</p>
                    <div className="text-4xl font-black text-white italic">{totalGastosMes.toLocaleString()}€</div>
                </Card>
            </div>

            <Tabs defaultValue="diario" className="space-y-8">
                <TabsList className="bg-zinc-950/50 border border-zinc-900 p-1.5 rounded-2xl h-auto">
                    <TabsTrigger value="diario" className="rounded-xl px-8 py-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2 transition-all">
                        <Calendar size={14} /> Registro Diario
                    </TabsTrigger>
                    <TabsTrigger value="fijos" className="rounded-xl px-8 py-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest gap-2 transition-all">
                        <RefreshCcw size={14} /> Gastos Fijos (Auto)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="diario">
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Formulario Diario */}
                        <div className="lg:col-span-4">
                            <Card className="bg-zinc-950 border-zinc-900 rounded-3xl sticky top-8 shadow-2xl">
                                <CardHeader>
                                    <CardTitle className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                        <Plus size={14} className="text-rose-600" />
                                        Registrar Gasto Variable
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddGasto} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Descripción</label>
                                            <Input
                                                placeholder="Ej: Reparación Saco"
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
                                                    className="bg-black border-zinc-800 text-white rounded-xl focus:border-rose-600 transition-colors font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Categoría</label>
                                            <Select value={categoria} onValueChange={setCategoria}>
                                                <SelectTrigger className="bg-black border-zinc-800 text-white rounded-xl focus:ring-rose-600 transition-colors">
                                                    <SelectValue placeholder="Categoría" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                                    <SelectItem value="Material">Material</SelectItem>
                                                    <SelectItem value="Suministros">Suministros</SelectItem>
                                                    <SelectItem value="Limpieza">Limpieza</SelectItem>
                                                    <SelectItem value="Otros">Otros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            className="w-full bg-rose-600 hover:bg-rose-700 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-600/10 mt-4 transition-all"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Guardar Registro"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabla General */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center gap-3 ml-2">
                                <DollarSign className="text-rose-600" size={18} />
                                <h2 className="text-xl font-bold text-white uppercase tracking-widest italic text-sm">Historial Económico</h2>
                            </div>
                            <div className="rounded-3xl border border-zinc-900 bg-black overflow-hidden shadow-2xl">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest px-8 py-5 italic">Concepto</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-center italic">Fecha</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-right px-8 italic">Importe</TableHead>
                                            <TableHead className="w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={4} className="py-20 text-center animate-pulse text-zinc-600 font-black italic uppercase">Cargando datos...</TableCell></TableRow>
                                        ) : (
                                            gastos.map((gasto) => (
                                                <TableRow key={gasto.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all group">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="font-bold text-white group-hover:text-rose-500 transition-colors uppercase italic flex items-center gap-2">
                                                            {gasto.origen_fijo_id && <RefreshCcw size={10} className="text-emerald-500" />}
                                                            {gasto.descripcion}
                                                        </div>
                                                        <div className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">{gasto.categoria}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center text-zinc-500 text-xs font-mono">{gasto.fecha_gasto}</TableCell>
                                                    <TableCell className="text-right px-8 font-black text-rose-500 text-lg italic whitespace-nowrap">-{gasto.monto}€</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteGasto(gasto.id)} className="text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl">
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
                </TabsContent>

                <TabsContent value="fijos">
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Editor de Plantillas */}
                        <div className="lg:col-span-4">
                            <Card className="bg-zinc-950 border-zinc-900 rounded-3xl sticky top-8 shadow-2xl">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <RefreshCcw size={20} className="text-emerald-500" />
                                        <CardTitle className="text-white font-bold uppercase tracking-widest text-xs">Añadir Gasto Fijo</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddGastoFijo} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Concepto Recurrente</label>
                                            <Input
                                                placeholder="Ej: Cuota Alquiler Gimnasio"
                                                value={descFijo}
                                                onChange={(e) => setDescFijo(e.target.value)}
                                                className="bg-black border-zinc-800 text-white rounded-xl focus:border-rose-600 transition-colors"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Monto Fijo (€)</label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={montoFijo}
                                                    onChange={(e) => setMontoFijo(e.target.value)}
                                                    className="bg-black border-zinc-800 text-white rounded-xl focus:border-rose-600 transition-colors font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Categoría</label>
                                                <Select value={catFijo} onValueChange={setCatFijo}>
                                                    <SelectTrigger className="bg-black border-zinc-800 text-white rounded-xl focus:ring-rose-600 transition-colors text-xs">
                                                        <SelectValue placeholder="Categoría" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                                        <SelectItem value="Alquiler">Alquiler</SelectItem>
                                                        <SelectItem value="Sueldos">Sueldos</SelectItem>
                                                        <SelectItem value="Impuestos">Impuestos</SelectItem>
                                                        <SelectItem value="Software">Software</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">¿Aplicar al mes actual?</label>
                                            <Select value={aplicarAhora} onValueChange={setAplicarAhora}>
                                                <SelectTrigger className="bg-black border-zinc-800 text-white rounded-xl focus:ring-rose-600 transition-colors">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                                    <SelectItem value="no">No, a partir del mes que viene</SelectItem>
                                                    <SelectItem value="si">Sí, aplicarlo también este mes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
                                            <AlertCircle size={32} className="text-emerald-500 shrink-0" />
                                            <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                                Los gastos fijos se regeneran solos al inicio de cada mes una vez configurados.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full bg-zinc-900 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-500 h-14 rounded-2xl font-black uppercase text-xs tracking-widest transition-all mt-4"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Crear Plantilla Fija"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Listado de Plantillas */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between ml-2">
                                <div className="flex items-center gap-3">
                                    <Settings2 className="text-emerald-500" size={18} />
                                    <h2 className="text-xl font-bold text-white uppercase tracking-widest italic text-sm">Plantillas de Cargo Automático</h2>
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sistema de Auto-Cobro Activo</span>
                                </div>
                            </div>
                            <div className="rounded-3xl border border-zinc-900 bg-black overflow-hidden shadow-2xl">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest px-8 py-5 italic">Gasto Mensual</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-center italic">Prioridad</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-right px-8 italic">Monto Mensual</TableHead>
                                            <TableHead className="w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gastosFijos.map((fijo) => (
                                            <TableRow key={fijo.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all group">
                                                <TableCell className="px-8 py-6">
                                                    <div className="font-bold text-white group-hover:text-emerald-500 transition-colors uppercase italic">{fijo.descripcion}</div>
                                                    <div className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
                                                        <RefreshCcw size={8} /> Recurrente cada mes
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="px-2 py-1 bg-zinc-900 rounded text-[9px] font-bold text-zinc-500 border border-zinc-800 uppercase tracking-widest">{fijo.categoria}</span>
                                                </TableCell>
                                                <TableCell className="text-right px-8 font-black text-white text-xl italic whitespace-nowrap">-{fijo.monto}€</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteGastoFijo(fijo.id)} className="text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                                        <Trash size={16} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {gastosFijos.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-20 text-center text-zinc-600 italic text-sm">
                                                    Aún no has configurado ningún gasto recurrente para el gimnasio.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
