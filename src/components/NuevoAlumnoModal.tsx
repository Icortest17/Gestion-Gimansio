"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { formatDateToMes } from "@/lib/utils-pagos";

export function NuevoAlumnoModal({ onAlumnoCreated }: { onAlumnoCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [disciplinas, setDisciplinas] = useState<{ id: string, nombre: string }[]>([]);
    const [entrenadores, setEntrenadores] = useState<{ id: string, nombre: string }[]>([]);

    const [formData, setFormData] = useState({
        nombre_completo: "",
        telefono: "",
        disciplina: "",
        entrenador_id: "",
        entrenador_nombre: "",
        precio_mensual: "",
        fecha_ingreso: new Date().toISOString().split('T')[0],
        registrarPago: true,
        es_recurrente: true
    });

    useEffect(() => {
        if (open) {
            loadOptions();
        }
    }, [open]);

    async function loadOptions() {
        const { data: dData } = await supabase.from("disciplinas").select("*").order("nombre");
        const { data: eData } = await supabase.from("entrenadores").select("id, nombre").order("nombre");

        if (dData) setDisciplinas(dData);
        if (eData) setEntrenadores(eData);

        // Pre-select first options if available
        setFormData(prev => ({
            ...prev,
            disciplina: dData?.[0]?.nombre || "",
            entrenador_id: eData?.[0]?.id || "",
            entrenador_nombre: eData?.[0]?.nombre || "",
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Insertar Alumno
            const { data: alumno, error: alumnoError } = await supabase.from("perfiles_alumnos").insert([
                {
                    nombre_completo: formData.nombre_completo,
                    telefono: formData.telefono || null,
                    disciplina: formData.disciplina,
                    entrenador_asignado: formData.entrenador_nombre,
                    entrenador_id: formData.entrenador_id,
                    precio_mensual: parseFloat(formData.precio_mensual),
                    fecha_ingreso: formData.fecha_ingreso,
                    es_recurrente: formData.es_recurrente
                },
            ]).select().single();

            if (alumnoError) throw alumnoError;

            // 2. Registrar Pago Automático si está marcado
            if (formData.registrarPago && alumno) {
                const mesPago = formatDateToMes(formData.fecha_ingreso);
                const { error: pagoError } = await supabase.from("registro_pagos").insert([
                    {
                        alumno_id: alumno.id,
                        mes_correspondiente: mesPago,
                        monto: alumno.precio_mensual,
                        fecha_pago: new Date().toISOString().split('T')[0]
                    }
                ]);
                if (pagoError) console.error("Error al registrar pago automático:", pagoError.message);
            }

            setOpen(false);
            setFormData({
                nombre_completo: "",
                telefono: "",
                disciplina: "",
                entrenador_id: "",
                entrenador_nombre: "",
                precio_mensual: "",
                fecha_ingreso: new Date().toISOString().split('T')[0],
                registrarPago: true,
                es_recurrente: true
            });
            onAlumnoCreated();
        } catch (err: any) {
            alert("Error creando alumno: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Alumno
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Registrar Nuevo Alumno</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Añade los datos del nuevo estudiante a tu academia.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-foreground">Nombre Completo</Label>
                        <Input
                            id="nombre"
                            required
                            className="bg-background border-border"
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                            placeholder="Ej: Max Holloway"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-foreground">Teléfono (Opcional)</Label>
                        <Input
                            id="telefono"
                            className="bg-background border-border"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            placeholder="+34 600..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="disciplina" className="text-foreground">Disciplina</Label>
                            <Select
                                value={formData.disciplina}
                                onValueChange={(value) => setFormData({ ...formData, disciplina: value })}
                            >
                                <SelectTrigger id="disciplina" className="bg-background border-border">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {disciplinas.map(d => (
                                        <SelectItem key={d.id} value={d.nombre}>{d.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="entrenador" className="text-foreground">Entrenador</Label>
                            <Select
                                value={formData.entrenador_id}
                                onValueChange={(value) => {
                                    const coach = entrenadores.find(c => c.id === value);
                                    setFormData({
                                        ...formData,
                                        entrenador_id: value,
                                        entrenador_nombre: coach?.nombre || ""
                                    });
                                }}
                            >
                                <SelectTrigger id="entrenador" className="bg-background border-border">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {entrenadores.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="precio" className="text-foreground">Cuota Mensual (€/$)</Label>
                            <Input
                                id="precio"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className="bg-background border-border"
                                value={formData.precio_mensual}
                                onChange={(e) => setFormData({ ...formData, precio_mensual: e.target.value })}
                                placeholder="Ej: 50.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fecha_ingreso" className="text-foreground">Fecha Ingreso</Label>
                            <Input
                                id="fecha_ingreso"
                                type="date"
                                required
                                className="bg-background border-border"
                                value={formData.fecha_ingreso}
                                onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <input
                            type="checkbox"
                            id="registrarPago"
                            checked={formData.registrarPago}
                            onChange={(e) => setFormData({ ...formData, registrarPago: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="registrarPago" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            Registrar cobro del primer mes automáticamente
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <input
                            type="checkbox"
                            id="es_recurrente"
                            checked={formData.es_recurrente}
                            onChange={(e) => setFormData({ ...formData, es_recurrente: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="es_recurrente" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            Alumno Recurrente (Aparecerá el próximo mes)
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white">
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Alumno"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
