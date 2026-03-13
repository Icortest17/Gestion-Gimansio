"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Search, Phone, Calendar, User, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import Link from "next/link";

type Contacto = Database["public"]["Tables"]["contactos"]["Row"];

export default function AgendaPage() {
    const [contactos, setContactos] = useState<Contacto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadContactos();
    }, []);

    async function loadContactos() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("contactos")
                .select("*")
                .order("nombre_completo");

            if (error) throw error;
            setContactos(data || []);
        } catch (error: any) {
            console.error("Error cargando contactos:", error.message);
        } finally {
            setLoading(false);
        }
    }

    const filteredContactos = contactos.filter(c =>
        c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.telefono && c.telefono.includes(searchTerm))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-rose-500/20">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            Agenda de Contactos
                        </h1>
                        <p className="text-muted-foreground">Directorio telefónico e histórico de clientes</p>
                    </div>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o teléfono..."
                    className="pl-10 bg-zinc-900/50 border-zinc-800 focus:ring-rose-500 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grilla/Tabla de Contactos */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Cargando contactos...</div>
                ) : filteredContactos.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">No se encontraron contactos.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredContactos.map((contacto) => (
                            <div
                                key={contacto.id}
                                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:bg-zinc-900/60 hover:border-rose-500/50"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-white font-semibold text-lg">
                                            <User className="h-4 w-4 text-rose-500" />
                                            {contacto.nombre_completo}
                                        </div>

                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4 text-rose-500" />
                                            {contacto.telefono || "Sin teléfono"}
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                                            <Calendar className="h-4 w-4" />
                                            Último Pago: {contacto.fecha_ultimo_pago ? new Date(contacto.fecha_ultimo_pago).toLocaleDateString() : "Nunca"}
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 h-full w-1 bg-rose-500 translate-x-1 group-hover:translate-x-0 transition-transform" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
