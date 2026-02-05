// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Assegura que as variáveis de ambiente existem para evitar erros em runtime
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);