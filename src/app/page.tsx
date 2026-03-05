"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { NuevoAlumnoModal } from "@/components/NuevoAlumnoModal";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      // Load Alumnos
      const { data: alumnosData } = await supabase
        .from("perfiles_alumnos")
        .select("*")
        .order("nombre_completo");
      if (alumnosData) setAlumnos(alumnosData);

      // Load Pagos for current month
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM-01 format
      const { data: pagosData } = await supabase
        .from("registro_pagos")
        .select("*")
        .gte("mes_correspondiente", currentMonth);
      if (pagosData) setPagosMesActual(pagosData);

      setLoading(false);
    }
    loadData();
  }, []);

  const refreshAlumnos = async () => {
    setLoading(true);
    const { data } = await supabase.from("perfiles_alumnos").select("*").order("nombre_completo");
    if (data) setAlumnos(data);
    setLoading(false);
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
          <p className="text-muted-foreground text-foreground/70">Gestiona tus alumnos y los pagos del mes en curso.</p>
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
              <TableHead className="text-right text-foreground">Estado (Mes Actual)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Cargando datos...
                </TableCell>
              </TableRow>
            ) : filteredAlumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {alumnos.length === 0 ? "No hay alumnos registrados." : "No hay resultados para la búsqueda."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlumnos.map((alumno) => (
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
                    {hasPaid(alumno.id) ? (
                      <Badge variant="success">Pagado</Badge>
                    ) : (
                      <Badge variant="destructive">Impago</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
