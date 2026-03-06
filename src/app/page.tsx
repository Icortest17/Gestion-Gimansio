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
  const [gastosMesActual, setGastosMesActual] = useState<Database["public"]["Tables"]["gastos"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPago, setProcessingPago] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDisciplina, setFilterDisciplina] = useState("Todos");
  const [filterEntrenador, setFilterEntrenador] = useState("Todos");

  const mesActualStr = getMesActual();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        console.log("Cargando datos para:", mesActualStr);
        // Load Alumnos
        const { data: alumnosData, error: alError } = await supabase
          .from("perfiles_alumnos")
          .select("*")
          .order("nombre_completo");

        if (alError) throw alError;
        setAlumnos(alumnosData || []);

        // Load Pagos for current month
        const { data: pagosData, error: pgError } = await supabase
          .from("registro_pagos")
          .select("*")
          .eq("mes_correspondiente", mesActualStr);

        if (pgError) throw pgError;
        setPagosMesActual(pagosData || []);

        // Load Gastos for current month
        // Nota: Filtrado simple por fecha (mes actual)
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const { data: gastosData, error: gsError } = await supabase
          .from("gastos")
          .select("*")
          .gte("fecha_gasto", startOfMonth);

        if (gsError) throw gsError;
        setGastosMesActual(gastosData || []);
      } catch (err) {
        console.error("Error cargando Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mesActualStr]);

  const refreshAlumnos = async () => {
    const { data } = await supabase.from("perfiles_alumnos").select("*").order("nombre_completo");
    if (data) setAlumnos(data);

    const { data: pagosData } = await supabase
      .from("registro_pagos")
      .select("*")
      .eq("mes_correspondiente", mesActualStr);
    if (pagosData) setPagosMesActual(pagosData || []);
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
      const nameMatch = alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase());
      const discMatch = filterDisciplina === "Todos" || alumno.disciplina === filterDisciplina;
      const trainMatch = filterEntrenador === "Todos" || alumno.entrenador_asignado === filterEntrenador;

      return nameMatch && discMatch && trainMatch;
    })
    .sort((a, b) => {
      const aPaid = hasPaid(a.id);
      const bPaid = hasPaid(b.id);
      if (aPaid !== bPaid) return aPaid ? 1 : -1;
      return a.nombre_completo.localeCompare(b.nombre_completo);
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard General</h1>
          <p className="text-zinc-500 mt-1">
            Gestiona tus alumnos y los pagos de <span className="text-rose-500 font-semibold uppercase">{mesActualStr}</span>.
          </p>
        </div>
        <NuevoAlumnoModal onAlumnoCreated={refreshAlumnos} />
      </div>

      <KpiStats
        alumnos={alumnos}
        pagos={pagosMesActual}
        gastos={gastosMesActual}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-950/50 p-6 rounded-2xl border border-zinc-900 border-dashed">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <Tabs value={filterDisciplina} onValueChange={setFilterDisciplina} className="w-full sm:w-auto">
            <TabsList className="bg-black border border-zinc-900 h-11 p-1">
              <TabsTrigger value="Todos" className="rounded-md data-[state=active]:bg-rose-600 data-[state=active]:text-white">Todos</TabsTrigger>
              <TabsTrigger value="Boxeo" className="rounded-md data-[state=active]:bg-rose-600 data-[state=active]:text-white">Boxeo</TabsTrigger>
              <TabsTrigger value="Sanda" className="rounded-md data-[state=active]:bg-rose-600 data-[state=active]:text-white">Sanda</TabsTrigger>
              <TabsTrigger value="BJJ" className="rounded-md data-[state=active]:bg-rose-600 data-[state=active]:text-white">BJJ</TabsTrigger>
            </TabsList>
          </Tabs>

          <select
            value={filterEntrenador}
            onChange={(e) => setFilterEntrenador(e.target.value)}
            className="h-11 w-full sm:w-48 bg-black border border-zinc-900 rounded-lg px-3 text-sm text-zinc-400 focus:outline-none focus:border-rose-600 appearance-none transition-colors"
          >
            <option value="Todos">Todos los entrenadores</option>
            {/* Cargando dinámicamente desde los alumnos actuales para simplicidad inmediata */}
            {Array.from(new Set(alumnos.map(a => a.entrenador_asignado))).sort().map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 items-center space-x-2 bg-black p-1 pl-4 rounded-xl border border-zinc-900 w-full max-w-lg lg:max-w-md">
          <Search className="h-5 w-5 text-zinc-600" />
          <Input
            className="border-0 focus-visible:ring-0 shadow-none bg-transparent text-white"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-900 bg-black overflow-hidden shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-900 hover:bg-transparent bg-zinc-950/50">
              <TableHead className="w-[200px] text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Alumno</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Disciplina</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-center">Entrenador</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-right">Cuota</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-right">Estado</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
                    <span className="text-zinc-500 text-sm">Cargando alumnos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAlumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-zinc-500">
                  {alumnos.length === 0 ? "No hay alumnos registrados." : "No se encontraron resultados para tu búsqueda."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlumnos.map((alumno) => {
                const pagado = hasPaid(alumno.id);
                return (
                  <TableRow key={alumno.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-colors group">
                    <TableCell className="font-semibold text-white group-hover:text-rose-400 transition-colors">
                      {alumno.nombre_completo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-zinc-800 text-zinc-400 bg-zinc-950/50">
                        {alumno.disciplina}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-zinc-500 text-sm">
                      {alumno.entrenador_asignado}
                    </TableCell>
                    <TableCell className="text-right font-bold text-white">
                      {alumno.precio_mensual}€
                    </TableCell>
                    <TableCell className="text-right">
                      {pagado ? (
                        <Badge className="bg-emerald-600/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                          PAGADO
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-600/10 text-rose-500 border-rose-500/20 px-3 py-1">
                          PENDIENTE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagado || processingPago === alumno.id}
                          onClick={() => handleRegistrarPago(alumno)}
                          className={`h-9 w-9 p-0 border-zinc-800 bg-black hover:border-rose-600 hover:text-white transition-all ${pagado ? "opacity-20 cursor-not-allowed group-hover:opacity-100" : "text-zinc-500"}`}
                        >
                          {processingPago === alumno.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-white hover:bg-zinc-900">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black border-zinc-900 text-zinc-400 min-w-48 p-2">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-600 px-2 py-1.5">Acciones</DropdownMenuLabel>
                            <EditarAlumnoModal alumno={alumno} onAlumnoUpdated={refreshAlumnos} />
                            <DropdownMenuSeparator className="bg-zinc-900" />
                            <DropdownMenuItem
                              className="text-white focus:bg-rose-600 focus:text-white rounded-md cursor-pointer flex items-center gap-2"
                              onClick={() => handleDeleteAlumno(alumno.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                              Eliminar Registro
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
