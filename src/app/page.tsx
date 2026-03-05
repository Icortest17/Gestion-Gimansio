"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard, Loader2 } from "lucide-react";
import { NuevoAlumnoModal } from "@/components/NuevoAlumnoModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { getMesActual } from "@/lib/utils-pagos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Alumno = Database["public"]["Tables"]["perfiles_alumnos"]["Row"];
type Pago = Database["public"]["Tables"]["registro_pagos"]["Row"];

export default function Home() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [pagosMesActual, setPagosMesActual] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPago, setProcessingPago] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const mesActualStr = getMesActual();

  useEffect(() => {
    async function loadData() {
      // Load Alumnos
      const { data: alumnosData } = await supabase
        .from("perfiles_alumnos")
        .select("*")
        .order("nombre_completo");
      if (alumnosData) setAlumnos(alumnosData);

      // Load Pagos for current month (formatted as string now)
      const { data: pagosData } = await supabase
        .from("registro_pagos")
        .select("*")
        .eq("mes_correspondiente", mesActualStr);
      if (pagosData) setPagosMesActual(pagosData || []);

      setLoading(false);
    }
    loadData();
  }, [mesActualStr]);

  const refreshAlumnos = async () => {
    setLoading(true);
    const { data } = await supabase.from("perfiles_alumnos").select("*").order("nombre_completo");
    if (data) setAlumnos(data);
    setLoading(false);
  };

  const handleRegistrarPago = async (alumno: Alumno) => {
    setProcessingPago(alumno.id);

    try {
      const { data, error } = await supabase
        .from("registro_pagos")
        .insert([
          {
            alumno_id: alumno.id,
            monto: alumno.precio_mensual,
            mes_correspondiente: mesActualStr,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update state immediately (Optimistic UI style)
      if (data) {
        setPagosMesActual((prev) => [...prev, data]);
      }
    } catch (err: any) {
      alert("Error al registrar pago: " + err.message);
    } finally {
      setProcessingPago(null);
    }
  };

  const hasPaid = (alumnoId: string) => {
    return pagosMesActual.some((p) => p.alumno_id === alumnoId);
  };

  const filteredAlumnos = alumnos.filter(alumno =>
    alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.entrenador_asignado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>
          <p className="text-muted-foreground text-foreground/70">
            Gestiona tus alumnos y los pagos de <span className="text-primary font-semibold">{mesActualStr}</span>.
          </p>
        </div>
        <NuevoAlumnoModal onAlumnoCreated={refreshAlumnos} />
      </div>

      <div className="flex items-center space-x-2 bg-card/50 p-1 rounded-md border border-border">
        <Search className="h-5 w-5 text-muted-foreground ml-2" />
        <Input
          className="border-0 focus-visible:ring-0 shadow-none bg-transparent"
          placeholder="Buscar por nombre, disciplina o entrenador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent text-muted-foreground">
              <TableHead className="w-[250px] text-foreground">Nombre</TableHead>
              <TableHead className="text-foreground">Disciplina</TableHead>
              <TableHead className="text-foreground">Entrenador</TableHead>
              <TableHead className="text-foreground">Teléfono</TableHead>
              <TableHead className="text-right text-foreground">Cuota</TableHead>
              <TableHead className="text-right text-foreground">Estado</TableHead>
              <TableHead className="text-right text-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Cargando datos...
                </TableCell>
              </TableRow>
            ) : filteredAlumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {alumnos.length === 0 ? "No hay alumnos registrados." : "No hay resultados para la búsqueda."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlumnos.map((alumno) => {
                const pagado = hasPaid(alumno.id);
                return (
                  <TableRow key={alumno.id} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-foreground">{alumno.nombre_completo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-primary/30 text-primary-foreground/90">
                        {alumno.disciplina}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground/80">{alumno.entrenador_asignado}</TableCell>
                    <TableCell className="text-muted-foreground">{alumno.telefono || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">${alumno.precio_mensual}</TableCell>
                    <TableCell className="text-right">
                      {pagado ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent">
                          PAGADO
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-600 hover:bg-rose-600 text-white border-transparent">
                          PENDIENTE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagado || processingPago === alumno.id}
                        onClick={() => handleRegistrarPago(alumno)}
                        className={`h-8 px-2 border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white transition-all ${pagado ? "opacity-50 cursor-not-allowed border-muted text-muted" : ""
                          }`}
                      >
                        {processingPago === alumno.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Registrar Pago
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
