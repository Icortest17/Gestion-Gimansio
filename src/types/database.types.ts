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
      contactos: {
        Row: {
          id: string
          nombre_completo: string
          telefono: string | null
          fecha_ultimo_pago: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre_completo: string
          telefono?: string | null
          fecha_ultimo_pago?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre_completo?: string
          telefono?: string | null
          fecha_ultimo_pago?: string | null
          created_at?: string
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          id: string
          nombre: string
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          created_at?: string | null
        }
        Relationships: []
      }
      entrenadores: {
        Row: {
          porcentaje_comision: number | null
          fecha_alta: string | null
          id: string
          nombre: string
        }
        Insert: {
          porcentaje_comision?: number | null
          fecha_alta?: string | null
          id?: string
          nombre: string
        }
        Update: {
          porcentaje_comision?: number | null
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
          origen_fijo_id: string | null
        }
        Insert: {
          categoria?: string | null
          descripcion: string
          fecha_gasto?: string | null
          id?: string
          monto: number
          origen_fijo_id?: string | null
        }
        Update: {
          categoria?: string | null
          descripcion?: string
          fecha_gasto?: string | null
          id?: string
          monto?: number
          origen_fijo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_origen_fijo_id_fkey"
            columns: ["origen_fijo_id"]
            isOneToOne: false
            referencedRelation: "gastos_fijos"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_fijos: {
        Row: {
          activo: boolean | null
          categoria: string
          created_at: string | null
          descripcion: string
          id: string
          monto: number
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          created_at?: string | null
          descripcion: string
          id?: string
          monto: number
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          created_at?: string | null
          descripcion?: string
          id?: string
          monto?: number
        }
        Relationships: []
      }
      perfiles_alumnos: {
        Row: {
          disciplina: string
          entrenador_asignado: string
          entrenador_id: string | null
          fecha_ingreso: string | null
          fecha_baja: string | null
          id: string
          nombre_completo: string
          precio_mensual: number
          telefono: string | null
        }
        Insert: {
          disciplina: string
          entrenador_asignado: string
          entrenador_id?: string | null
          fecha_ingreso?: string | null
          fecha_baja?: string | null
          id?: string
          nombre_completo: string
          precio_mensual: number
          telefono?: string | null
        }
        Update: {
          disciplina?: string
          entrenador_asignado?: string
          entrenador_id?: string | null
          fecha_ingreso?: string | null
          fecha_baja?: string | null
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
      registro_automatizacion: {
        Row: {
          mes_año: string
          procesado_en: string | null
        }
        Insert: {
          mes_año: string
          procesado_en?: string | null
        }
        Update: {
          mes_año?: string
          procesado_en?: string | null
        }
        Relationships: []
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
