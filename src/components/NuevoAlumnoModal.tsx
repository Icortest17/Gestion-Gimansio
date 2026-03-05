"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
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

type Disciplina = Database["public"]["Enums"]["disciplina_enum"];
type Entrenador = Database["public"]["Enums"]["entrenador_enum"];

export function NuevoAlumnoModal({ onAlumnoCreated }: { onAlumnoCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: "",
        telefono: "",
        disciplina: "Boxeo" as Disciplina,
        entrenador_asignado: "Isaac" as Entrenador,
        precio_mensual: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("perfiles_alumnos").insert([
                {
                    nombre_completo: formData.nombre_completo,
                    telefono: formData.telefono || null,
                    disciplina: formData.disciplina,
                    entrenador_asignado: formData.entrenador_asignado,
                    precio_mensual: parseFloat(formData.precio_mensual),
                },
            ]);

            if (error) throw error;

            setOpen(false);
            setFormData({
                nombre_completo: "",
                telefono: "",
                disciplina: "Boxeo",
                entrenador_asignado: "Isaac",
                precio_mensual: ""
            });
            onAlumnoCreated(); // Refresh table
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert("Error creando alumno: " + err.message);
            } else {
                alert("Error creando alumno");
            }
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
                                onValueChange={(value: Disciplina) => setFormData({ ...formData, disciplina: value })}
                            >
                                <SelectTrigger id="disciplina" className="bg-background border-border">
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
                            <Label htmlFor="entrenador" className="text-foreground">Entrenador</Label>
                            <Select
                                value={formData.entrenador_asignado}
                                onValueChange={(value: Entrenador) => setFormData({ ...formData, entrenador_asignado: value })}
                            >
                                <SelectTrigger id="entrenador" className="bg-background border-border">
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
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white">
                            {loading ? "Guardando..." : "Guardar Alumno"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
