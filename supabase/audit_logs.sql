-- Create the audit_logs table if it doesn't exist
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Drop existing policies to avoid errors when re-running
drop policy if exists "Enable read access for admins" on public.audit_logs;
drop policy if exists "Enable insert for authenticated users" on public.audit_logs;

-- Create policies
create policy "Enable read access for admins"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('Gestor Supremo', 'Contratações')
    )
  );

create policy "Enable insert for authenticated users"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');
