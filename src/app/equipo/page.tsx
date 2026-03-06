"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash, Loader2, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
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

type Entrenador = Database["public"]["Tables"]["entrenadores"]["Row"];

export default function EquipoPage() {
    const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNombre, setNewNombre] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadEntrenadores();
    }, []);

    async function loadEntrenadores() {
        setLoading(true);
        const { data, error } = await supabase
            .from("entrenadores")
            .select("*")
            .order("nombre", { ascending: true });

        if (data) setEntrenadores(data);
        setLoading(false);
    }

    async function handleAddEntrenador(e: React.FormEvent) {
        e.preventDefault();
        if (!newNombre.trim()) return;

        setIsSubmitting(true);
        const { error } = await supabase
            .from("entrenadores")
            .insert([{ nombre: newNombre.trim() }]);

        if (!error) {
            setNewNombre("");
            loadEntrenadores();
        }
        setIsSubmitting(false);
    }

    async function handleDeleteEntrenador(id: string) {
        if (!confirm("¿Estás seguro de que deseas eliminar a este entrenador? Esto podría afectar a los alumnos asignados.")) return;

        const { error } = await supabase
            .from("entrenadores")
            .delete()
            .eq("id", id);

        if (!error) {
            loadEntrenadores();
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                        Gestión de <span className="text-rose-600">Equipo</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">Administra el personal técnico y entrenadores del centro.</p>
                </div>

                <form onSubmit={handleAddEntrenador} className="flex items-center gap-2 bg-zinc-950 p-2 rounded-2xl border border-zinc-900 shadow-2xl">
                    <Input
                        placeholder="Nombre del entrenador..."
                        value={newNombre}
                        onChange={(e) => setNewNombre(e.target.value)}
                        className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-700 w-48 md:w-64"
                    />
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 font-bold uppercase text-xs tracking-widest gap-2"
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
                        <Card key={i} className="bg-zinc-950/50 border-zinc-900 animate-pulse h-40 rounded-3xl" />
                    ))
                ) : (
                    entrenadores.map((entrenador) => (
                        <Card key={entrenador.id} className="bg-zinc-950/50 border-zinc-900 hover:border-rose-500/50 transition-all duration-300 group rounded-3xl overflow-hidden relative shadow-2xl">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:bg-rose-600/10 transition-colors">
                                        <Users className="text-zinc-500 group-hover:text-rose-500 h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg font-bold text-white group-hover:text-rose-500 transition-colors">
                                        {entrenador.nombre}
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteEntrenador(entrenador.id)}
                                    className="text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10"
                                >
                                    <Trash size={16} />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                        <Calendar size={12} className="text-rose-600" />
                                        Alta: {new Date(entrenador.fecha_alta!).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-tighter">
                                        ID: {entrenador.id.split('-')[0]}...
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Stats / Table Overview */}
            <div className="rounded-3xl border border-zinc-900 bg-black overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/80">
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest px-8 py-5">Entrenador</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-center">Fecha Incorporación</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-center">Estado</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right px-8">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entrenadores.map((entrenador) => (
                            <TableRow key={entrenador.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-all">
                                <TableCell className="font-bold text-white px-8 py-4">{entrenador.nombre}</TableCell>
                                <TableCell className="text-center text-zinc-500 text-sm italic">
                                    {new Date(entrenador.fecha_alta!).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                                        <div className="h-1 w-1 bg-rose-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Activo</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right px-8">
                                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white uppercase text-[10px] font-bold">Ver Perfil</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
