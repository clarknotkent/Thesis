-- Rewrite schedule functions for DOB-based recalculation (Option A)
-- Run in Supabase SQL editor as a privileged role.

-- 1) Force-update a single patientschedule row to a supplied date, bypassing interval/concurrency checks.
create or replace function public.rewrite_patientschedule_date(
  p_patient_schedule_id bigint,
  p_new_date date,
  p_user_id bigint,
  p_preserve_rescheduled boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_grace integer := 0;
  v_new_status text;
  v_is_future boolean;
begin
  -- local rewrite flag (no-op unless validation checks it)
  perform set_config('app.rewrite_mode','on', true);

  select ps.patient_schedule_id,
         ps.patient_id,
         ps.vaccine_id,
         ps.dose_number,
         ps.scheduled_date,
         ps.eligible_date,
         ps.actual_date,
         ps.status
  into v_rec
  from public.patientschedule ps
  where ps.patient_schedule_id = p_patient_schedule_id;

  if not found then
    raise exception 'patientschedule % not found', p_patient_schedule_id;
  end if;

  -- grace days
  select sd.grace_period_days
    into v_grace
  from public.schedule_doses sd
  join public.schedule_master sm on sm.id = sd.schedule_id
  where sm.vaccine_id = v_rec.vaccine_id
    and sd.dose_number = v_rec.dose_number
  limit 1;

  -- set new date, preserve id
  update public.patientschedule
     set scheduled_date = p_new_date,
         eligible_date  = p_new_date,
         updated_at     = now(),
         updated_by     = p_user_id
   where patient_schedule_id = v_rec.patient_schedule_id;

  -- derive status
  if v_rec.actual_date is not null then
    v_new_status := 'Completed';
  else
    v_is_future := (p_new_date > current_date);
    if p_preserve_rescheduled and v_rec.status = 'Rescheduled' and v_is_future then
      v_new_status := 'Rescheduled';
    else
      if (p_new_date + (coalesce(v_grace,0) * interval '1 day'))::date < current_date then
        v_new_status := 'Missed';
      elsif p_new_date <= current_date then
        v_new_status := 'Due';
      else
        v_new_status := 'Scheduled';
      end if;
    end if;
  end if;

  if v_rec.status is distinct from v_new_status then
    update public.patientschedule
       set status = v_new_status,
           updated_at = now()
     where patient_schedule_id = v_rec.patient_schedule_id;

    insert into public.activitylogs(action_type, user_id, entity_type, entity_id, description, "timestamp")
    values ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', v_rec.patient_schedule_id,
            'DOB rewrite -> ' || to_char(p_new_date, 'YYYY-MM-DD') || ' (bypass intervals)', current_timestamp);
  end if;
end;
$$;

grant execute on function public.rewrite_patientschedule_date(bigint, date, bigint, boolean)
  to authenticated, service_role;


-- 2) Cascade DOB rewrite: delete + recreate pending schedules with DOB + due_after_days, preserving original IDs.
--    Adds dry-run & JSON preview, preserves completed schedules unless explicitly included.
--    IMPORTANT: Drop legacy 3-arg signature to avoid call ambiguity.
drop function if exists public.rewrite_patient_schedules_for_dob(bigint, bigint, boolean);
create or replace function public.rewrite_patient_schedules_for_dob(
  p_patient_id bigint,
  p_user_id bigint,
  p_insert_missing boolean default true,
  p_include_completed boolean default false,
  p_dry_run boolean default false
)
returns table(
  replaced_count integer,
  inserted_missing_count integer,
  dry_run boolean,
  failed_ids bigint[],
  preview jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_birth date;
  v_failed_ids bigint[] := '{}';
  v_replaced int := 0;
  v_inserted int := 0;
  v_preview jsonb := '[]'::jsonb;
  record_missing record; -- needed for FOR .. IN SELECT loop over tmp_missing
begin
  perform set_config('app.rewrite_mode','on', true);

  select date_of_birth into v_birth
  from public.patients
  where patient_id = p_patient_id;

  if v_birth is null then
    raise exception 'Patient % not found or has no date_of_birth', p_patient_id;
  end if;

  -- Snapshot target schedules (pending or optionally completed)
  create temporary table tmp_old_schedules on commit drop as
  select ps.patient_schedule_id,
         ps.vaccine_id,
         ps.dose_number,
         ps.scheduled_date    as old_date,
         ps.status            as old_status,
         ps.actual_date,
         (v_birth + (coalesce(sd.due_after_days,0) * interval '1 day'))::date as new_date,
         sd.due_after_days,
         sd.grace_period_days
  from public.patientschedule ps
  left join public.schedule_master sm on sm.vaccine_id = ps.vaccine_id and coalesce(sm.is_deleted,false) = false
  left join public.schedule_doses sd on sd.schedule_id = sm.id and sd.dose_number = ps.dose_number
  where ps.patient_id = p_patient_id
    and coalesce(ps.is_deleted,false) = false
    and (
      (ps.actual_date is null) or (p_include_completed and ps.actual_date is not null)
    );

  -- Build preview JSON (diff) first
  select jsonb_agg(
    jsonb_build_object(
      'patient_schedule_id', patient_schedule_id,
      'vaccine_id', vaccine_id,
      'dose_number', dose_number,
      'old_date', old_date,
      'new_date', new_date,
      'old_status', old_status,
      'actual_date', actual_date,
      'due_after_days', due_after_days,
      'grace_period_days', grace_period_days,
      'status_after', case
        when actual_date is not null then 'Completed'
        when new_date > current_date then 'Scheduled'
        when (new_date + (coalesce(grace_period_days,0) * interval '1 day'))::date < current_date then 'Missed'
        when new_date <= current_date then 'Due'
        else 'Scheduled'
      end
    )
  )
  into v_preview
  from tmp_old_schedules;

  if p_dry_run then
    replaced_count := (select count(*) from tmp_old_schedules where old_date is distinct from new_date);
    inserted_missing_count := 0; -- not executed in dry-run
    dry_run := true;
    failed_ids := v_failed_ids;
    preview := v_preview;
    return next;
    return; -- exit early
  end if;

  -- Delete old schedules (subset); preserve IDs for reinsert
  delete from public.patientschedule ps
  using tmp_old_schedules t
  where ps.patient_schedule_id = t.patient_schedule_id;

  -- Reinsert with same primary keys & recomputed dates
  begin
    insert into public.patientschedule(
      patient_schedule_id,
      patient_id,
      vaccine_id,
      dose_number,
      scheduled_date,
      eligible_date,
      actual_date,
      status,
      created_by,
      updated_by,
      created_at,
      updated_at
    )
    select t.patient_schedule_id,
           p_patient_id,
           t.vaccine_id,
           t.dose_number,
           t.new_date,
           t.new_date,
           t.actual_date,
           case
             when t.actual_date is not null then 'Completed'
             when t.new_date > current_date then 'Scheduled'
             when (t.new_date + (coalesce(t.grace_period_days,0) * interval '1 day'))::date < current_date then 'Missed'
             when t.new_date <= current_date then 'Due'
             else 'Scheduled'
           end,
           p_user_id,
           p_user_id,
           now(),
           now()
    from tmp_old_schedules t;
  exception when others then
    -- Insertion failure: collect IDs and continue
    v_failed_ids := v_failed_ids || (select array_agg(patient_schedule_id) from tmp_old_schedules);
  end;

  v_replaced := (select count(*) from tmp_old_schedules);

  -- Insert missing doses (that never existed) if requested
  if p_insert_missing then
    create temporary table tmp_missing on commit drop as
    with defined as (
      select sm.vaccine_id, sd.dose_number, sd.due_after_days
      from public.schedule_master sm
      join public.schedule_doses sd on sd.schedule_id = sm.id
      where coalesce(sm.is_deleted,false) = false
    ), existing as (
      select vaccine_id, dose_number
      from tmp_old_schedules
    )
    select d.vaccine_id, d.dose_number, d.due_after_days
    from defined d
    left join existing e
      on e.vaccine_id = d.vaccine_id and e.dose_number = d.dose_number
    where e.vaccine_id is null
    order by d.vaccine_id, d.dose_number;

    for record_missing in select * from tmp_missing loop
      begin
        insert into public.patientschedule(
          patient_id, vaccine_id, dose_number,
          scheduled_date, eligible_date, actual_date,
          status, created_by, updated_by
        ) values (
          p_patient_id,
          record_missing.vaccine_id,
          record_missing.dose_number,
          (v_birth + (coalesce(record_missing.due_after_days,0) * interval '1 day'))::date,
          (v_birth + (coalesce(record_missing.due_after_days,0) * interval '1 day'))::date,
          null,
          case
            when (v_birth + (coalesce(record_missing.due_after_days,0) * interval '1 day'))::date > current_date then 'Scheduled'
            when (v_birth + (coalesce(record_missing.due_after_days,0) * interval '1 day'))::date <= current_date then 'Due'
            else 'Scheduled'
          end,
          p_user_id,
          p_user_id
        ) on conflict (patient_id, vaccine_id, dose_number) do nothing;
        if found then
          v_inserted := v_inserted + 1;
        end if;
      exception when others then
        null; -- ignore insert error
      end;
    end loop;
  end if;

  -- Reset sequence to max(id) to avoid future collision
  perform setval('patientschedule_patient_schedule_id_seq', (select max(patient_schedule_id) from public.patientschedule), true);

  -- Activity logs for replaced schedules
  insert into public.activitylogs(action_type, user_id, entity_type, entity_id, description, "timestamp")
  select 'SCHEDULE_UPDATE', p_user_id, 'patientschedule', t.patient_schedule_id,
         'DOB cascade rewrite -> ' || to_char(t.new_date, 'YYYY-MM-DD'), current_timestamp
  from tmp_old_schedules t;

  -- Logs for newly inserted missing doses
  if v_inserted > 0 then
    insert into public.activitylogs(action_type, user_id, entity_type, entity_id, description, "timestamp")
    select 'SCHEDULE_CREATE', p_user_id, 'patientschedule', ps.patient_schedule_id,
           'DOB cascade created missing dose at ' || to_char(ps.scheduled_date, 'YYYY-MM-DD'), current_timestamp
    from public.patientschedule ps
    where ps.patient_id = p_patient_id
      and ps.created_at > now() - interval '5 minutes'; -- heuristic window
  end if;

  -- Optional portfolio recompute
  begin
    perform public.recompute_patient_schedule_statuses(p_patient_id);
  exception when undefined_function then
    null;
  end;

  replaced_count := v_replaced;
  inserted_missing_count := v_inserted;
  dry_run := false;
  failed_ids := v_failed_ids;
  preview := v_preview;
  return next;
end;
$$;

grant execute on function public.rewrite_patient_schedules_for_dob(bigint, bigint, boolean, boolean, boolean)
  to authenticated, service_role;

-- 3) Trigger guard support (ALWAYS include this at the very top of any validation trigger)
-- ------------------------------------------------------------------------------
-- Helper to check rewrite mode flag. Use in triggers to early-exit and bypass
-- interval / concurrency validations during a controlled rewrite operation.
-- Example integration shown below.
create or replace function public._rewrite_mode_guard()
returns boolean
language sql
stable
as $$
  select current_setting('app.rewrite_mode', true) = 'on';
$$;

-- Template: Modify existing patientschedule BEFORE INSERT/UPDATE validation trigger
-- Wrap original validation logic AFTER the guard. Replace `... original logic ...`
-- with the actual checks currently implemented in your environment.
-- NOTE: Do NOT drop existing trigger until you've copied its body under the guard.
--
-- create or replace function public.patientschedule_validate_before()
-- returns trigger
-- language plpgsql
-- as $$
-- begin
--   -- ALWAYS first line: guard rewrite mode
--   if public._rewrite_mode_guard() then
--     return NEW; -- skip validations entirely
--   end if;
--
--   -- ... original validation logic ...
--   -- e.g. interval checks, concurrent restrictions, status transitions
--
--   return NEW;
-- end;
-- $$;
--
-- (No GRANT needed for trigger functions unless called directly.)
-- After replacing the function body, existing trigger binding remains intact.
-- If you need to create a new trigger:
-- create trigger patientschedule_validate_before_trg
-- before insert or update on public.patientschedule
-- for each row execute function public.patientschedule_validate_before();
-- ------------------------------------------------------------------------------