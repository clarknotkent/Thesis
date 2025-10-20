-- Adds a revocable nonce to patients for QR signing and validation
-- Run this in Supabase SQL editor or via migration runner

-- 1) Add column if not exists
alter table if exists public.patients
  add column if not exists qr_nonce uuid;

-- 2) Backfill existing rows
update public.patients
set qr_nonce = gen_random_uuid()
where qr_nonce is null;

-- 3) Ensure new rows always get a nonce
create or replace function public.ensure_patient_qr_nonce()
returns trigger
language plpgsql
as $$
begin
  if NEW.qr_nonce is null then
    NEW.qr_nonce := gen_random_uuid();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_patients_qr_nonce on public.patients;
create trigger trg_patients_qr_nonce
before insert on public.patients
for each row execute function public.ensure_patient_qr_nonce();

-- 4) Index for quick lookups (optional but harmless)
create index if not exists idx_patients_qr_nonce on public.patients(qr_nonce);
