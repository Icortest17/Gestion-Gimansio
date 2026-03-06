"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard, Loader2, MoreVertical, Trash, Pencil, Sparkles } from "lucide-react";
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
type Gasto = Database["public"]["Tables"]["gastos"]["Row"];

export default function Home() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [pagosMesActual, setPagosMesActual] = useState<Pago[]>([]);
  const [gastosMesActual, setGastosMesActual] = useState<Gasto[]>([]);
  const [disciplinas, setDisciplinas] = useState<{ id: string, nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPago, setProcessingPago] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDisciplina, setFilterDisciplina] = useState("Todos");
  const [filterEntrenador, setFilterEntrenador] = useState("Todos");
  const [isSyncing, setIsSyncing] = useState(false);

  const mesActualStr = getMesActual();

  useEffect(() => {
    loadData();
  }, [mesActualStr]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Ejecutar Sincronización de Automatización (Gastos Fijos + Sueldos)
      // Pasamos los alumnos cargados previamente si es posible, o los cargamos dentro
      const { data: alumnosRaw } = await supabase.from("perfiles_alumnos").select("*");
      await checkAndApplyAutomation(alumnosRaw || []);

      // 2. Cargar Disciplinas para filtros
      const { data: dData } = await supabase.from("disciplinas").select("*").order("nombre");
      if (dData) setDisciplinas(dData);

      // 3. Cargar Alumnos (con orden para la tabla)
      const { data: alumnosData, error: alError } = await supabase
        .from("perfiles_alumnos")
        .select("*")
        .order("nombre_completo");

      if (alError) throw new Error(`Alumnos: ${alError.message}`);
      setAlumnos(alumnosData || []);

      // 4. Cargar Pagos del mes
      const { data: pagosData, error: pgError } = await supabase
        .from("registro_pagos")
        .select("*")
        .eq("mes_correspondiente", mesActualStr);

      if (pgError) throw new Error(`Pagos: ${pgError.message}`);
      setPagosMesActual(pagosData || []);

      // 5. Cargar Gastos del mes (Reales y Fijos ya insertados)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const { data: gastosData, error: gsError } = await supabase
        .from("gastos")
        .select("*")
        .gte("fecha_gasto", startOfMonth);

      if (!gsError) {
        setGastosMesActual(gastosData || []);
      }
    } catch (err: any) {
      console.error("Error Dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkAndApplyAutomation(alumnos: Alumno[]) {
    setIsSyncing(true);
    try {
      const { data: registro } = await supabase
        .from("registro_automatizacion")
        .select("*")
        .eq("mes_año", mesActualStr)
        .single();

      if (!registro) {
        console.log("Detectado nuevo mes. Generando gastos fijos y sueldos...");

        // --- PARTE A: Gastos Fijos ---
        const { data: fijos } = await supabase
          .from("gastos_fijos")
          .select("*")
          .eq("activo", true);

        const insertsGastos = [];

        if (fijos && fijos.length > 0) {
          insertsGastos.push(...fijos.map(f => ({
            descripcion: f.descripcion,
            monto: f.monto,
            categoria: f.categoria,
            fecha_gasto: new Date().toISOString().split('T')[0],
            origen_fijo_id: f.id
          })));
        }

        // --- PARTE B: Sueldos Entrenadores (Comisiones) ---
        const comisiones = await calculateCommissions(alumnos);
        if (comisiones.length > 0) {
          insertsGastos.push(...comisiones.map(c => ({
            descripcion: `Pago Sueldo: ${c.coach}`,
            monto: c.monto,
            categoria: 'Sueldos',
            fecha_gasto: new Date().toISOString().split('T')[0],
            origen_fijo_id: null
          })));
        }

        // Insertar todos de golpe si hay algo
        if (insertsGastos.length > 0) {
          await supabase.from("gastos").insert(insertsGastos);
        }

        // Marcar mes como procesado
        await supabase.from("registro_automatizacion").insert([{ mes_año: mesActualStr }]);
      }
    } catch (e) {
      console.error("Error in automation engine:", e);
    } finally {
      setIsSyncing(false);
    }
  }

  async function calculateCommissions(alumnos: Alumno[]) {
    const { data: coaches } = await supabase.from("entrenadores").select("*");
    if (!coaches) return [];

    return coaches.map(coach => {
      const myAlumnos = alumnos.filter(a => a.entrenador_id === coach.id);
      const porcentaje = coach.porcentaje_comision || 0;
      const totalVal = myAlumnos.reduce((acc, curr) => acc + (Number(curr.precio_mensual) * (porcentaje / 100)), 0);
      return { coach: coach.nombre, monto: totalVal };
    }).filter(c => c.monto > 0); // Solo insertar si hay algo que cobrar
  }

  const refreshAlumnos = async () => {
    loadData();
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
        .insert([{
          alumno_id: alumno.id,
          monto: alumno.precio_mensual,
          mes_correspondiente: mesActualStr,
        }])
        .select()
        .single();
      if (error) throw error;
      if (data) setPagosMesActual((prev) => [...prev, data]);
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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard General</h1>
            <p className="text-zinc-500 mt-1">
              Gestiona tus alumnos y los pagos de <span className="text-rose-500 font-semibold uppercase">{mesActualStr}</span>.
            </p>
          </div>
          {isSyncing && (
            <Badge className="bg-emerald-600/10 text-emerald-500 border-emerald-500/20 gap-2 px-3 py-1.5 animate-pulse">
              <Sparkles size={12} /> Sincronizando Finanzas...
            </Badge>
          )}
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
              {disciplinas.map(d => (
                <TabsTrigger key={d.id} value={d.nombre} className="rounded-md data-[state=active]:bg-rose-600 data-[state=active]:text-white uppercase text-[10px] tracking-widest font-bold">
                  {d.nombre}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <select
            value={filterEntrenador}
            onChange={(e) => setFilterEntrenador(e.target.value)}
            className="h-11 w-full sm:w-48 bg-black border border-zinc-900 rounded-lg px-3 text-sm text-zinc-400 focus:outline-none focus:border-rose-600 appearance-none transition-colors"
          >
            <option value="Todos">Todos los entrenadores</option>
            {Array.from(new Set(alumnos.map(a => a.entrenador_asignado))).sort().map(e => (
              e && <option key={e} value={e}>{e}</option>
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
                    <span className="text-zinc-500 text-sm">Cargando datos...</span>
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
