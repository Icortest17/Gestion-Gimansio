"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard, Loader2, MoreVertical, Trash, Pencil, Sparkles } from "lucide-react";
import { NuevoAlumnoModal } from "@/components/NuevoAlumnoModal";
import { EditarAlumnoModal } from "@/components/EditarAlumnoModal";
import { CobrarMesModal } from "@/components/CobrarMesModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { getMesActual } from "@/lib/utils-pagos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function getStartAndEndOfMonth(mesStr: string) {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const [mes, anio] = mesStr.split(' ');
  const mesIndex = meses.indexOf(mes);
  if (mesIndex === -1) return { start: '', end: '' };

  // Parsear a fecha local evitando problemas de zona horaria al aislar el formato
  const year = parseInt(anio);

  // Formato YYYY-MM-DD
  const start = `${year}-${String(mesIndex + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, mesIndex + 1, 0).getDate();
  const end = `${year}-${String(mesIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { start, end };
}

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
  const [mesActualStr, setMesActualStr] = useState<string>(getMesActual());

  const generateListMonths = () => {
    const result = [];
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // Hasta 6 meses atrás
    const mesesInfo = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    for (let i = 0; i < 12; i++) {
      result.push(`${mesesInfo[date.getMonth()]} ${date.getFullYear()}`);
      date.setMonth(date.getMonth() + 1);
    }
    return result;
  };
  const mesesDisponibles = generateListMonths();

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

      const { start: startOfMonth, end: endOfMonth } = getStartAndEndOfMonth(mesActualStr);

      // 3. Cargar Alumnos (con orden para la tabla) y filtrar los que entraron después de este mes
      const { data: alumnosData, error: alError } = await supabase
        .from("perfiles_alumnos")
        .select("*")
        .order("nombre_completo");

      if (alError) throw new Error(`Alumnos: ${alError.message}`);

      // Filtrar para no mostrar alumnos que se dieron de alta en un mes posterior al seleccionado
      const alumnosFiltrados = (alumnosData || []).filter(a => {
        if (!a.fecha_ingreso) return true;
        return a.fecha_ingreso <= endOfMonth;
      });
      setAlumnos(alumnosFiltrados);

      // 4. Cargar Pagos del mes
      const { data: pagosData, error: pgError } = await supabase
        .from("registro_pagos")
        .select("*")
        .eq("mes_correspondiente", mesActualStr);

      if (pgError) throw new Error(`Pagos: ${pgError.message}`);
      setPagosMesActual(pagosData || []);

      // 5. Cargar Gastos del mes (Reales y Fijos ya insertados)
      const { data: gastosData, error: gsError } = await supabase
        .from("gastos")
        .select("*")
        .gte("fecha_gasto", startOfMonth)
        .lte("fecha_gasto", endOfMonth);

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

        const insertsGastos: any[] = [];

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
        const validas = comisiones.filter(c => c.monto > 0);
        if (validas.length > 0) {
          insertsGastos.push(...validas.map(c => ({
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
      } else {
        // Mes ya procesado: sincronización dinámica de comisiones
        const { start: startOfMonth, end: endOfMonth } = getStartAndEndOfMonth(mesActualStr);
        const { data: sueldosExistentes } = await supabase
          .from("gastos")
          .select("id, descripcion, monto")
          .gte("fecha_gasto", startOfMonth)
          .lte("fecha_gasto", endOfMonth)
          .eq("categoria", "Sueldos")
          .like("descripcion", "Pago Sueldo:%");

        const comisiones = await calculateCommissions(alumnos);

        // 1. Insertar sueldos faltantes (que superen los 0€)
        const faltantes = comisiones.filter(c =>
          c.monto > 0 && !sueldosExistentes?.some(s => s.descripcion === `Pago Sueldo: ${c.coach}`)
        );

        if (faltantes.length > 0) {
          await supabase.from("gastos").insert(faltantes.map(c => ({
            descripcion: `Pago Sueldo: ${c.coach}`,
            monto: c.monto,
            categoria: 'Sueldos',
            fecha_gasto: new Date().toISOString().split('T')[0],
            origen_fijo_id: null
          })));
        }

        // 2. Actualizar o eliminar sueldos existentes que cambiaron de monto
        const desactualizados = comisiones.filter(c => {
          const existente = sueldosExistentes?.find(s => s.descripcion === `Pago Sueldo: ${c.coach}`);
          return existente && existente.monto !== c.monto;
        });

        for (const c of desactualizados) {
          const existente = sueldosExistentes?.find(s => s.descripcion === `Pago Sueldo: ${c.coach}`);
          if (existente) {
            if (c.monto === 0) {
              await supabase.from("gastos").delete().eq("id", existente.id);
            } else {
              await supabase.from("gastos").update({ monto: c.monto }).eq("id", existente.id);
            }
          }
        }
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
    });
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
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Dashboard
              <Select value={mesActualStr} onValueChange={setMesActualStr}>
                <SelectTrigger className="w-[200px] h-10 bg-zinc-900/50 border-zinc-800 text-rose-500 font-bold italic rounded-xl focus:ring-rose-500 transition-colors">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                  {mesesDisponibles.map(mes => (
                    <SelectItem key={mes} value={mes} className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2">
                      {mes} {mes === getMesActual() && "(Mes Actual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </h1>
            <p className="text-zinc-500 mt-1">
              Gestiona tus alumnos y cuentas visualizando el período seleccionado.
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
                        <CobrarMesModal
                          alumno={alumno}
                          mesActualPorDefecto={mesActualStr}
                          onPagoCompletado={(nuevoPago) => {
                            if (nuevoPago && nuevoPago.mes_correspondiente === mesActualStr) {
                              setPagosMesActual(prev => [...prev, nuevoPago]); // Actualización optimista de UI
                            }
                            loadData(); // Refresco silencioso en background
                          }}
                          pagadoMesActual={pagado}
                        />

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
