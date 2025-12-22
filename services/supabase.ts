
import { createClient } from '@supabase/supabase-js';

// The project URL and Anon Key are now loaded from environment variables for security.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This provides a clear error message if the Supabase credentials are not set.
  throw new Error("Supabase URL and Anon Key must be provided. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
