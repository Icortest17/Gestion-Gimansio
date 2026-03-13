import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.warn("WARNING: Faltan las variables de entorno de Supabase. Verifica la configuración en Vercel o tu archivo .env.local");
    }
}

// Durante el build de Next.js, estas variables pueden estar vacías. 
// Proporcionamos valores por defecto para que el build no explote.
export const supabase = createClient<Database>(
    supabaseUrl || "https://placeholder-url.supabase.co",
    supabaseAnonKey || "placeholder-key"
)
