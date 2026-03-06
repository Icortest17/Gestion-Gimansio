export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      entrenadores: {
        Row: {
          fecha_alta: string | null
          id: string
          nombre: string
        }
        Insert: {
          fecha_alta?: string | null
          id?: string
          nombre: string
        }
        Update: {
          fecha_alta?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      gastos: {
        Row: {
          categoria: string | null
          descripcion: string
          fecha_gasto: string | null
          id: string
          monto: number
        }
        Insert: {
          categoria?: string | null
          descripcion: string
          fecha_gasto?: string | null
          id?: string
          monto: number
        }
        Update: {
          categoria?: string | null
          descripcion?: string
          fecha_gasto?: string | null
          id?: string
          monto?: number
        }
        Relationships: []
      }
      perfiles_alumnos: {
        Row: {
          disciplina: Database["public"]["Enums"]["disciplina_enum"]
          entrenador_asignado: Database["public"]["Enums"]["entrenador_enum"]
          entrenador_id: string | null
          fecha_ingreso: string | null
          id: string
          nombre_completo: string
          precio_mensual: number
          telefono: string | null
        }
        Insert: {
          disciplina: Database["public"]["Enums"]["disciplina_enum"]
          entrenador_asignado: Database["public"]["Enums"]["entrenador_enum"]
          entrenador_id?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombre_completo: string
          precio_mensual: number
          telefono?: string | null
        }
        Update: {
          disciplina?: Database["public"]["Enums"]["disciplina_enum"]
          entrenador_asignado?: Database["public"]["Enums"]["entrenador_enum"]
          entrenador_id?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombre_completo?: string
          precio_mensual?: number
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_alumnos_entrenador_id_fkey"
            columns: ["entrenador_id"]
            isOneToOne: false
            referencedRelation: "entrenadores"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_pagos: {
        Row: {
          alumno_id: string | null
          fecha_pago: string | null
          id: string
          mes_correspondiente: string
          monto: number
        }
        Insert: {
          alumno_id?: string | null
          fecha_pago?: string | null
          id?: string
          mes_correspondiente: string
          monto: number
        }
        Update: {
          alumno_id?: string | null
          fecha_pago?: string | null
          id?: string
          mes_correspondiente?: string
          monto?: number
        }
        Relationships: [
          {
            foreignKeyName: "registro_pagos_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "perfiles_alumnos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      disciplina_enum: "Boxeo" | "Sanda" | "BJJ"
      entrenador_enum: "Chamon" | "Lupu" | "Isaac" | "Angel" | "Carlos"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
