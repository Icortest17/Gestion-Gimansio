"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
type Disciplina = Database["public"]["Enums"]["disciplina_enum"];
type Entrenador = Database["public"]["Enums"]["entrenador_enum"];

interface EditarAlumnoModalProps {
    alumno: Alumno;
    onAlumnoUpdated: () => void;
}

export function EditarAlumnoModal({ alumno, onAlumnoUpdated }: EditarAlumnoModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: alumno.nombre_completo,
        telefono: alumno.telefono || "",
        disciplina: alumno.disciplina as Disciplina,
        entrenador_asignado: alumno.entrenador_asignado as Entrenador,
        precio_mensual: alumno.precio_mensual?.toString() || "",
    });

    // Reset form when modal opens with a new alumno
    useEffect(() => {
        if (open) {
            setFormData({
                nombre_completo: alumno.nombre_completo,
                telefono: alumno.telefono || "",
                disciplina: alumno.disciplina as Disciplina,
                entrenador_asignado: alumno.entrenador_asignado as Entrenador,
                precio_mensual: alumno.precio_mensual?.toString() || "",
            });
        }
    }, [open, alumno]);

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
                    entrenador_asignado: formData.entrenador_asignado,
                    precio_mensual: parseFloat(formData.precio_mensual),
                })
                .eq("id", alumno.id);

            if (error) throw error;

            setOpen(false);
            onAlumnoUpdated(); // Refresh table
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert("Error actualizando alumno: " + err.message);
            } else {
                alert("Error actualizando alumno");
            }
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
                                onValueChange={(value: Disciplina) => setFormData({ ...formData, disciplina: value })}
                            >
                                <SelectTrigger id="edit-disciplina" className="bg-background border-border">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="Boxeo">Boxeo</SelectItem>
                                    <SelectItem value="Sanda">Sanda</SelectItem>
                                    <SelectItem value="BJJ">BJJ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-entrenador" className="text-foreground">Entrenador</Label>
                            <Select
                                value={formData.entrenador_asignado}
                                onValueChange={(value: Entrenador) => setFormData({ ...formData, entrenador_asignado: value })}
                            >
                                <SelectTrigger id="edit-entrenador" className="bg-background border-border">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="Chamon">Chamon</SelectItem>
                                    <SelectItem value="Lupu">Lupu</SelectItem>
                                    <SelectItem value="Isaac">Isaac</SelectItem>
                                    <SelectItem value="Angel">Angel</SelectItem>
                                    <SelectItem value="Carlos">Carlos</SelectItem>
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
                            {loading ? "Actualizando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
