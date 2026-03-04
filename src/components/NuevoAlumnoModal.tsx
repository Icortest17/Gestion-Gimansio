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
import { supabase } from "@/lib/supabase";

export function NuevoAlumnoModal({ onAlumnoCreated }: { onAlumnoCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: "",
        telefono: "",
        disciplina: "Boxeo",
        precio_mensual: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("perfiles_alumnos").insert([
                {
                    nombre_completo: formData.nombre_completo,
                    telefono: formData.telefono,
                    disciplina: formData.disciplina as "Boxeo" | "MMA" | "Muay Thai" | "BJJ",
                    precio_mensual: parseFloat(formData.precio_mensual),
                },
            ]);

            if (error) throw error;

            setOpen(false);
            setFormData({ nombre_completo: "", telefono: "", disciplina: "Boxeo", precio_mensual: "" });
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
                <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Alumno
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
                    <DialogDescription>
                        Añade los datos del nuevo estudiante a tu academia.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre Completo</Label>
                        <Input
                            id="nombre"
                            required
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                            placeholder="Ej: Max Holloway"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                        <Input
                            id="telefono"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            placeholder="+34 600..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="disciplina">Disciplina</Label>
                        <select
                            id="disciplina"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={formData.disciplina}
                            onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
                        >
                            <option className="bg-background text-foreground" value="Boxeo">Boxeo</option>
                            <option className="bg-background text-foreground" value="MMA">MMA</option>
                            <option className="bg-background text-foreground" value="Muay Thai">Muay Thai</option>
                            <option className="bg-background text-foreground" value="BJJ">BJJ</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="precio">Cuota Mensual (€/$)</Label>
                        <Input
                            id="precio"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.precio_mensual}
                            onChange={(e) => setFormData({ ...formData, precio_mensual: e.target.value })}
                            placeholder="Ej: 50.00"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar Alumno"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
