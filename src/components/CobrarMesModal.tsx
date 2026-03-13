"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type Alumno = Database["public"]["Tables"]["perfiles_alumnos"]["Row"];

interface CobrarMesModalProps {
    alumno: Alumno;
    mesActualPorDefecto: string;
    onPagoCompletado: (pago?: any) => void;
    pagadoMesActual: boolean;
}

export function CobrarMesModal({ alumno, mesActualPorDefecto, onPagoCompletado, pagadoMesActual }: CobrarMesModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mesSeleccionado, setMesSeleccionado] = useState(mesActualPorDefecto);

    // Generar últimos 3 meses y próximos 3 meses dinámicamente
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const generateLastAndNextMonths = () => {
        const result = [];
        const date = new Date();
        date.setMonth(date.getMonth() - 3); // Empezar 3 meses antes

        for (let i = 0; i < 7; i++) {
            const m = `${meses[date.getMonth()]} ${date.getFullYear()}`;
            result.push(m);
            date.setMonth(date.getMonth() + 1);
        }
        return result;
    };

    const mesesDisponibles = generateLastAndNextMonths();

    // Asegurarnos que el mes actual por defecto esté en la lista, si no, lo añadimos
    if (!mesesDisponibles.includes(mesActualPorDefecto)) {
        mesesDisponibles.push(mesActualPorDefecto);
    }

    const handleRegistrarPago = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from("registro_pagos")
                .insert([{
                    alumno_id: alumno.id,
                    monto: alumno.precio_mensual,
                    mes_correspondiente: mesSeleccionado,
                    fecha_pago: new Date().toISOString().split('T')[0]
                }]);

            if (error) throw error;

            setOpen(false);
            onPagoCompletado(); // Esto recargará los datos del dashboard
        } catch (err: any) {
            alert("Error al registrar pago: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`h-9 w-9 p-0 border-zinc-800 bg-black hover:border-emerald-500 hover:text-white transition-all ${pagadoMesActual ? "opacity-20 cursor-not-allowed group-hover:opacity-100" : "text-zinc-500"}`}
                >
                    <CreditCard className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-900 text-white sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
                        Registrar <span className="text-emerald-500">Pago</span>
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRegistrarPago} className="space-y-6 pt-4">
                    <div className="bg-black/50 border border-zinc-900 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Alumno</p>
                            <p className="font-bold text-white uppercase italic">{alumno.nombre_completo}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cuota Mensual</p>
                            <p className="text-xl font-black text-emerald-500 italic">{alumno.precio_mensual}€</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Mes que se está abonando</label>
                        <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
                            <SelectTrigger className="bg-black border-zinc-800 text-white rounded-xl focus:ring-emerald-500 transition-colors h-14">
                                <SelectValue placeholder="Selecciona un mes" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                {mesesDisponibles.map(mes => (
                                    <SelectItem key={mes} value={mes} className="focus:bg-zinc-900 focus:text-white cursor-pointer py-3">
                                        {mes} {mes === mesActualPorDefecto && "(Actual)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 transition-all mt-4"
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : null}
                        Confirmar Cobro ({alumno.precio_mensual}€)
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
