"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard, Loader2, MoreVertical, Trash, Pencil } from "lucide-react";
import { NuevoAlumnoModal } from "@/components/NuevoAlumnoModal";
import { EditarAlumnoModal } from "@/components/EditarAlumnoModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { getMesActual } from "@/lib/utils-pagos";
import { KpiStats } from "@/components/KpiStats";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type Alumno = Database["public"]["Tables"]["perfiles_alumnos"]["Row"];
type Pago = Database["public"]["Tables"]["registro_pagos"]["Row"];

export default function Home() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [pagosMesActual, setPagosMesActual] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPago, setProcessingPago] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDisciplina, setFilterDisciplina] = useState("Todos");

  const mesActualStr = getMesActual();

  useEffect(() => {
    async function loadData() {
      // Load Alumnos
      const { data: alumnosData } = await supabase
        .from("perfiles_alumnos")
        .select("*")
        .order("nombre_completo");
      if (alumnosData) setAlumnos(alumnosData);

      // Load Pagos for current month
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
    const { data } = await supabase.from("perfiles_alumnos").select("*").order("nombre_completo");
    if (data) setAlumnos(data);
  };

  const handleDeleteAlumno = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar a este alumno?")) return;

    try {
      const { error } = await supabase.from("perfiles_alumnos").delete().eq("id", id);
      if (error) throw error;
      setAlumnos((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert("Error al eliminar alumno: " + err.message);
    }
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

  const filteredAlumnos = alumnos
    .filter(alumno => {
      const matchesSearch =
        alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.entrenador_asignado.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDisciplina = filterDisciplina === "Todos" || alumno.disciplina === filterDisciplina;

      return matchesSearch && matchesDisciplina;
    })
    .sort((a, b) => {
      const aPaid = hasPaid(a.id);
      const bPaid = hasPaid(b.id);
      // Sort by status (PENDIENTE first)
      if (aPaid !== bPaid) {
        return aPaid ? 1 : -1;
      }
      // Then alphabetically by name
      return a.nombre_completo.localeCompare(b.nombre_completo);
    });

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

      <KpiStats alumnos={alumnos} pagos={pagosMesActual} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={filterDisciplina} onValueChange={setFilterDisciplina} className="w-full md:w-auto">
          <TabsList className="bg-zinc-950 border-zinc-800">
            <TabsTrigger value="Todos">Todos</TabsTrigger>
            <TabsTrigger value="Boxeo">Boxeo</TabsTrigger>
            <TabsTrigger value="Sanda">Sanda</TabsTrigger>
            <TabsTrigger value="BJJ">BJJ</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-1 items-center space-x-2 bg-card/50 p-1 rounded-md border border-border max-w-md">
          <Search className="h-5 w-5 text-muted-foreground ml-2" />
          <Input
            className="border-0 focus-visible:ring-0 shadow-none bg-transparent"
            placeholder="Buscar por nombre, disciplina o entrenador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Cargando datos...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAlumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {alumnos.length === 0 ? "No hay alumnos registrados." : "No hay resultados para el filtro actual."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlumnos.map((alumno) => {
                const pagado = hasPaid(alumno.id);
                return (
                  <TableRow key={alumno.id} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-foreground">{alumno.nombre_completo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-rose-500/30 text-rose-500 bg-rose-500/5">
                        {alumno.disciplina}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground/80">{alumno.entrenador_asignado}</TableCell>
                    <TableCell className="text-muted-foreground">{alumno.telefono || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">{alumno.precio_mensual}€</TableCell>
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
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Pay Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          title="Registrar Pago"
                          disabled={pagado || processingPago === alumno.id}
                          onClick={() => handleRegistrarPago(alumno)}
                          className={`h-8 w-8 p-0 border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white transition-all ${pagado ? "opacity-30 border-muted text-muted" : ""}`}
                        >
                          {processingPago === alumno.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black border-zinc-800">
                            <DropdownMenuLabel className="text-zinc-500 text-[10px] uppercase tracking-wider">Gestión</DropdownMenuLabel>
                            <EditarAlumnoModal alumno={alumno} onAlumnoUpdated={refreshAlumnos} />
                            <DropdownMenuItem
                              className="text-white focus:bg-rose-600 focus:text-white cursor-pointer"
                              onClick={() => handleDeleteAlumno(alumno.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar Alumno
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
