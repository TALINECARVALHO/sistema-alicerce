-- Fix for missing created_at column in audit_logs
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now()) not null;
