"use client";

import { useState, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
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
import { Database } from "@/types/database.types";

type Alumno = Database["public"]["Tables"]["perfiles_alumnos"]["Row"];

interface EditarAlumnoModalProps {
    alumno: Alumno;
    onAlumnoUpdated: () => void;
}

export function EditarAlumnoModal({ alumno, onAlumnoUpdated }: EditarAlumnoModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [disciplinas, setDisciplinas] = useState<{ id: string, nombre: string }[]>([]);
    const [entrenadores, setEntrenadores] = useState<{ id: string, nombre: string }[]>([]);

    const [formData, setFormData] = useState({
        nombre_completo: alumno.nombre_completo,
        telefono: alumno.telefono || "",
        disciplina: alumno.disciplina || "",
        entrenador_id: alumno.entrenador_id || "",
        entrenador_nombre: alumno.entrenador_asignado || "",
        precio_mensual: alumno.precio_mensual?.toString() || "",
    });

    useEffect(() => {
        if (open) {
            loadOptions();
            setFormData({
                nombre_completo: alumno.nombre_completo,
                telefono: alumno.telefono || "",
                disciplina: alumno.disciplina || "",
                entrenador_id: alumno.entrenador_id || "",
                entrenador_nombre: alumno.entrenador_asignado || "",
                precio_mensual: alumno.precio_mensual?.toString() || "",
            });
        }
    }, [open, alumno]);

    async function loadOptions() {
        const { data: dData } = await supabase.from("disciplinas").select("*").order("nombre");
        const { data: eData } = await supabase.from("entrenadores").select("id, nombre").order("nombre");
        if (dData) setDisciplinas(dData);
        if (eData) setEntrenadores(eData);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("perfiles_alumnos")
                .update({
                    nombre_completo: formData.nombre_completo,
                    telefono: formData.telefono || null,
                    disciplina: formData.disciplina,
                    entrenador_asignado: formData.entrenador_nombre,
                    entrenador_id: formData.entrenador_id,
                    precio_mensual: parseFloat(formData.precio_mensual),
                })
                .eq("id", alumno.id);

            if (error) throw error;

            setOpen(false);
            onAlumnoUpdated();
        } catch (err: any) {
            alert("Error actualizando alumno: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-white hover:bg-rose-500/20">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Editar Alumno</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modifica los datos del alumno seleccionado.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-nombre" className="text-foreground">Nombre Completo</Label>
                        <Input
                            id="edit-nombre"
                            required
                            className="bg-background border-border"
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-telefono" className="text-foreground">Teléfono</Label>
                        <Input
                            id="edit-telefono"
                            className="bg-background border-border"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-disciplina" className="text-foreground">Disciplina</Label>
                            <Select
                                value={formData.disciplina}
                                onValueChange={(value) => setFormData({ ...formData, disciplina: value })}
                            >
                                <SelectTrigger id="edit-disciplina" className="bg-background border-border">
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
                            <Label htmlFor="edit-entrenador" className="text-foreground">Entrenador</Label>
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
                                <SelectTrigger id="edit-entrenador" className="bg-background border-border">
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
                    <div className="space-y-2">
                        <Label htmlFor="edit-precio" className="text-foreground">Cuota Mensual (€/$)</Label>
                        <Input
                            id="edit-precio"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="bg-background border-border"
                            value={formData.precio_mensual}
                            onChange={(e) => setFormData({ ...formData, precio_mensual: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white">
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
