"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash, Loader2, ShieldCheck, Mail, Phone, Calendar, Percent, DollarSign, Save, Target, Plus } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type Entrenador = Database["public"]["Tables"]["entrenadores"]["Row"] & {
    alumnos_count?: number;
    sueldo_proyectado?: number;
};

type Disciplina = {
    id: string;
    nombre: string;
};

export default function EquipoPage() {
    const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [loading, setLoading] = useState(true);

    // Form Entrenadores
    const [newNombre, setNewNombre] = useState("");
    const [newComision, setNewComision] = useState("0");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Disciplinas
    const [newDiscNombre, setNewDiscNombre] = useState("");
    const [isSubmittingDisc, setIsSubmittingDisc] = useState(false);

    const [editMode, setEditMode] = useState<string | null>(null);
    const [tempComision, setTempComision] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);

        // 1. Cargar disciplinas
        const { data: dData } = await supabase.from("disciplinas").select("*").order("nombre");
        if (dData) setDisciplinas(dData);

        // 2. Cargar entrenadores
        const { data: coaches, error: coachError } = await supabase
            .from("entrenadores")
            .select("*")
            .order("nombre", { ascending: true });

        if (coachError) {
            console.error("Error cargando entrenadores:", coachError);
            setLoading(false);
            return;
        }

        // 3. Cargar alumnos para calcular comisiones
        const { data: alumnos, error: alumnosError } = await supabase
            .from("perfiles_alumnos")
            .select("entrenador_id, precio_mensual");

        if (alumnosError) {
            console.error("Error cargando alumnos para comisiones:", alumnosError);
            setEntrenadores(coaches || []);
            setLoading(false);
            return;
        }

        // 4. Mapear datos
        const enrichedCoaches = coaches?.map(coach => {
            const myAlumnos = alumnos?.filter(a => a.entrenador_id === coach.id) || [];
            const count = myAlumnos.length;
            const comisionBase = coach.porcentaje_comision || 0;

            const sueldo = myAlumnos.reduce((acc, curr) => {
                return acc + (Number(curr.precio_mensual) * (comisionBase / 100));
            }, 0);

            return {
                ...coach,
                alumnos_count: count,
                sueldo_proyectado: sueldo
            };
        });

        setEntrenadores(enrichedCoaches || []);
        setLoading(false);
    }

    async function handleAddEntrenador(e: React.FormEvent) {
        e.preventDefault();
        if (!newNombre.trim()) return;

        setIsSubmitting(true);
        const { error } = await supabase
            .from("entrenadores")
            .insert([{
                nombre: newNombre.trim(),
                porcentaje_comision: Number(newComision)
            }]);

        if (!error) {
            setNewNombre("");
            setNewComision("0");
            loadData();
        }
        setIsSubmitting(false);
    }

    async function handleAddDisciplina(e: React.FormEvent) {
        e.preventDefault();
        if (!newDiscNombre.trim()) return;

        setIsSubmittingDisc(true);
        const { error } = await supabase
            .from("disciplinas")
            .insert([{ nombre: newDiscNombre.trim() }]);

        if (!error) {
            setNewDiscNombre("");
            loadData();
        }
        setIsSubmittingDisc(false);
    }

    async function handleUpdateComision(id: string, valor: number) {
        const { error } = await supabase
            .from("entrenadores")
            .update({ porcentaje_comision: valor })
            .eq("id", id);

        if (!error) {
            setEditMode(null);
            loadData();
        }
    }

    async function handleDeleteEntrenador(id: string) {
        if (!confirm("¿Estás seguro de eliminar a este entrenador?")) return;
        const { error } = await supabase.from("entrenadores").delete().eq("id", id);
        if (!error) loadData();
    }

    async function handleDeleteDisciplina(id: string) {
        if (!confirm("¿Eliminar esta disciplina? Esto no afectará a los alumnos ya registrados, pero dejará de estar disponible para nuevos registros.")) return;
        const { error } = await supabase.from("disciplinas").delete().eq("id", id);
        if (!error) loadData();
    }

    return (
        <div className="p-4 md:p-8 space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header y Alta Entrenador */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                        Gestión de <span className="text-rose-600">Equipo</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">Administra el personal técnico y sus comisiones porcentuales.</p>
                </div>

                <form onSubmit={handleAddEntrenador} className="flex flex-wrap items-center gap-3 bg-zinc-950 p-3 rounded-3xl border border-zinc-900 shadow-2xl">
                    <Input
                        placeholder="Nombre Entrenador..."
                        value={newNombre}
                        onChange={(e) => setNewNombre(e.target.value)}
                        className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-700 w-32 md:w-48"
                    />
                    <div className="flex items-center gap-2 px-3 border-l border-zinc-800">
                        <Percent size={14} className="text-zinc-600" />
                        <Input
                            type="number"
                            placeholder="Comisión %"
                            value={newComision}
                            min="0"
                            max="100"
                            onChange={(e) => setNewComision(e.target.value)}
                            className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-700 w-20"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-6 font-bold uppercase text-[10px] tracking-widest gap-2 h-12"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <UserPlus size={16} />}
                        Añadir
                    </Button>
                </form>
            </div>

            {/* Coaches Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="bg-zinc-950/50 border-zinc-900 animate-pulse h-48 rounded-3xl" />
                    ))
                ) : (
                    entrenadores.map((entrenador) => (
                        <Card key={entrenador.id} className="bg-zinc-950/50 border-zinc-900 hover:border-rose-500/50 transition-all duration-300 group rounded-3xl overflow-hidden relative shadow-2xl">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:bg-rose-600/10 transition-colors">
                                        <Users className="text-zinc-500 group-hover:text-rose-500 h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black text-white group-hover:text-rose-500 transition-colors italic uppercase tracking-tighter">
                                            {entrenador.nombre}
                                        </CardTitle>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                            <ShieldCheck size={10} className="text-rose-600" />
                                            Especialista Activo
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteEntrenador(entrenador.id)}
                                    className="text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                                >
                                    <Trash size={18} />
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/50 p-4 rounded-2xl border border-zinc-900 group-hover:border-rose-600/20 transition-colors">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Percent size={10} className="text-rose-600" /> Comisión
                                        </p>
                                        {editMode === entrenador.id ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={tempComision}
                                                    onChange={(e) => setTempComision(Number(e.target.value))}
                                                    className="h-8 bg-zinc-900 border-zinc-800 text-white text-xs"
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleUpdateComision(entrenador.id, tempComision)}>
                                                    <Save size={14} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                className="text-2xl font-black text-white italic cursor-pointer hover:text-rose-500 transition-colors"
                                                onClick={() => {
                                                    setEditMode(entrenador.id);
                                                    setTempComision(entrenador.porcentaje_comision || 0);
                                                }}
                                            >
                                                {entrenador.porcentaje_comision}%
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-black/50 p-4 rounded-2xl border border-zinc-900 group-hover:border-emerald-600/20 transition-colors">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <DollarSign size={10} className="text-emerald-500" /> Proyectado
                                        </p>
                                        <div className="text-2xl font-black text-emerald-500 italic">
                                            {entrenador.sueldo_proyectado?.toLocaleString()}€
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* SECCIÓN DISCIPLINAS */}
            <div className="grid gap-8 lg:grid-cols-12 border-t border-zinc-900 pt-12">
                <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase flex items-center gap-3">
                            <Target className="text-rose-600" /> Disciplinas
                        </h2>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Configura las artes que se imparten.</p>
                    </div>

                    <Card className="bg-zinc-950 border-zinc-900 rounded-3xl shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-white font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <Plus size={14} className="text-rose-600" /> Nueva Disciplina
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddDisciplina} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre del arte/clase</label>
                                    <Input
                                        placeholder="Ej: Muay Thai"
                                        value={newDiscNombre}
                                        onChange={(e) => setNewDiscNombre(e.target.value)}
                                        className="bg-black border-zinc-800 text-white rounded-xl focus:border-rose-600 transition-colors"
                                    />
                                </div>
                                <Button
                                    disabled={isSubmittingDisc}
                                    className="w-full bg-zinc-900 border border-rose-600/30 hover:bg-rose-600 hover:text-white text-rose-500 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                                >
                                    {isSubmittingDisc ? <Loader2 className="animate-spin h-4 w-4" /> : "Añadir al Sistema"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8">
                    <div className="rounded-3xl border border-zinc-900 bg-black overflow-hidden shadow-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest px-8 py-5 italic">Disciplina Técnica</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-center italic">Estado</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {disciplinas.map((disc) => (
                                    <TableRow key={disc.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all group">
                                        <TableCell className="px-8 py-5">
                                            <div className="font-bold text-white group-hover:text-rose-500 transition-colors uppercase italic flex items-center gap-2 text-lg">
                                                {disc.nombre}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-[9px] font-bold text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">
                                                ACTIVO
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDisciplina(disc.id)} className="text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl">
                                                <Trash size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {disciplinas.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-10 text-center text-zinc-600 italic">No hay disciplinas configuradas.</TableCell>
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
