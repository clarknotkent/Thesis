-- 076_reschedule_and_enforce.sql
-- Purpose: Implement robust rescheduling RPC with cascade and DAD-group behavior
--          and enhance concurrency/min_interval_other enforcement.

-- 1) Enhance: enforce_vaccine_interval
CREATE OR REPLACE FUNCTION public.enforce_vaccine_interval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_min_interval INTEGER;
    v_max_interval INTEGER;
    v_min_interval_other INTEGER;
    v_concurrent BOOLEAN;
    v_dob DATE;
    v_due_after INTEGER;
    v_baseline_due DATE;
    v_other_nearest DATE;
    v_other_concurrent BOOLEAN;
    v_other_diff INTEGER;
    v_candidate DATE := NEW.scheduled_date::date;
    v_ctx text := current_setting('app.reschedule_ctx', true);
BEGIN
    -- Skip enforcement on UPDATEs that do not change scheduled_date (e.g., status-only updates)
    IF TG_OP = 'UPDATE' AND NEW.scheduled_date IS NOT DISTINCT FROM OLD.scheduled_date THEN
        RETURN NEW;
    END IF;

    -- Gather patient DOB and schedule metadata
    SELECT p.date_of_birth INTO v_dob FROM patients p WHERE p.patient_id = NEW.patient_id;

    -- Determine schedule metadata for the exact (vaccine_id, dose_number)
    IF NEW.dose_number IS NULL THEN
        RAISE EXCEPTION 'Dose number is required to enforce schedule rules.';
    END IF;

    SELECT sd.min_interval_days,
           sd.max_interval_days,
           sd.min_interval_other_vax,
           sm.concurrent_allowed,
           sd.due_after_days
    INTO v_min_interval, v_max_interval, v_min_interval_other, v_concurrent, v_due_after
    FROM schedule_doses sd
    JOIN schedule_master sm ON sd.schedule_id = sm.id
    WHERE sm.vaccine_id = NEW.vaccine_id
      AND sd.dose_number = NEW.dose_number
      AND COALESCE(sm.is_deleted, false) = false
      AND COALESCE(sd.is_deleted, false) = false
    ORDER BY sm.id ASC
    LIMIT 1;

    IF v_due_after IS NULL THEN
        RAISE EXCEPTION 'Missing schedule definition: vaccine_id %, dose_number %', NEW.vaccine_id, NEW.dose_number;
    END IF;

    -- Compute baseline due date (DOB + due_after_days) if available
    IF v_dob IS NOT NULL AND v_due_after IS NOT NULL THEN
        v_baseline_due := (v_dob + (v_due_after * INTERVAL '1 day'))::date;
    ELSE
        v_baseline_due := NULL;
    END IF;

    -- 1) DAD baseline hard check: never allow scheduling earlier than baseline due (DOB + due_after_days)
    IF v_baseline_due IS NOT NULL AND v_candidate < v_baseline_due THEN
        RAISE EXCEPTION 'PS:% V:% D:% — Scheduled date (%) cannot be earlier than baseline due_after_days (%).', NEW.patient_schedule_id, NEW.vaccine_id, NEW.dose_number, v_candidate, v_baseline_due;
    END IF;

    -- 2) Same vaccine doses same-day prohibition (skip during DFS to allow sequential correction)
    IF COALESCE(v_ctx,'') <> 'dfs' AND EXISTS (
        SELECT 1 FROM patientschedule ps
        WHERE ps.patient_id = NEW.patient_id AND ps.vaccine_id = NEW.vaccine_id AND ps.dose_number <> NEW.dose_number
          AND COALESCE(ps.is_deleted,false) = false AND COALESCE(ps.actual_date, ps.scheduled_date)::date = v_candidate
    ) THEN
        RAISE EXCEPTION 'Same vaccine doses cannot share the same day (%).', v_candidate;
    END IF;

    -- 3) Same-day concurrency symmetry (skip during DFS orchestration to allow temporary states)
    IF COALESCE(v_ctx,'') <> 'dfs' AND EXISTS (
        SELECT 1
        FROM patientschedule ps
        JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
        WHERE ps.patient_id = NEW.patient_id AND ps.vaccine_id <> NEW.vaccine_id
          AND COALESCE(ps.is_deleted,false) = false AND COALESCE(ps.actual_date, ps.scheduled_date)::date = v_candidate
          AND NOT (COALESCE(v_concurrent,false) AND COALESCE(sm2.concurrent_allowed,false))
    ) THEN
        RAISE EXCEPTION 'Same-day concurrency disallowed by one of the vaccines (%).', v_candidate;
    END IF;

    -- 4) Cross-vaccine minimum spacing (skip during DFS orchestration to allow temporary states)
    IF COALESCE(v_ctx,'') <> 'dfs' AND v_min_interval_other IS NOT NULL THEN
        SELECT COALESCE(ps.actual_date, ps.scheduled_date)::date AS odate, sm2.concurrent_allowed
        INTO v_other_nearest, v_other_concurrent
        FROM patientschedule ps
        JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
        WHERE ps.patient_id = NEW.patient_id AND ps.vaccine_id <> NEW.vaccine_id AND COALESCE(ps.is_deleted,false) = false
        ORDER BY ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - v_candidate)
        LIMIT 1;

        IF v_other_nearest IS NOT NULL THEN
            v_other_diff := ABS(v_candidate - v_other_nearest);
            IF v_other_diff = 0 THEN
                IF COALESCE(v_concurrent,false) AND COALESCE(v_other_concurrent,false) THEN
                    -- same-day allowed by both; ok
                ELSE
                    RAISE EXCEPTION 'Same-day scheduling not allowed due to concurrency rule (%).', v_candidate;
                END IF;
            ELSIF v_other_diff < v_min_interval_other THEN
                RAISE EXCEPTION 'Too close to other vaccine date (diff % days; min % days).', v_other_diff, v_min_interval_other;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Convenience wrapper: debug checkpoints by (patient_id, vaccine_id, dose_number)
CREATE OR REPLACE FUNCTION public.debug_reschedule_checkpoints_by(
    p_patient_id bigint,
    p_vaccine_id bigint,
    p_dose_number integer,
    p_new_date date
)
RETURNS TABLE (
    rule text,
    passed boolean,
    detail jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ps_id bigint;
BEGIN
    SELECT patient_schedule_id INTO v_ps_id
    FROM patientschedule
    WHERE patient_id = p_patient_id
      AND vaccine_id = p_vaccine_id
      AND dose_number = p_dose_number
      AND COALESCE(is_deleted, false) = false
    ORDER BY patient_schedule_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'patientschedule not found for patient %, vaccine %, dose %', p_patient_id, p_vaccine_id, p_dose_number;
    END IF;

    RETURN QUERY SELECT * FROM public.debug_reschedule_checkpoints(v_ps_id, p_new_date);
END;
$$;

-- Convenience wrapper: debug trace by (patient_id, vaccine_id, dose_number)
CREATE OR REPLACE FUNCTION public.debug_reschedule_trace_by(
    p_patient_id bigint,
    p_vaccine_id bigint,
    p_dose_number integer,
    p_new_date date,
    p_user_id bigint DEFAULT NULL
)
RETURNS TABLE (
    trace jsonb,
    changes jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ps_id bigint;
BEGIN
    SELECT patient_schedule_id INTO v_ps_id
    FROM patientschedule
    WHERE patient_id = p_patient_id
      AND vaccine_id = p_vaccine_id
      AND dose_number = p_dose_number
      AND COALESCE(is_deleted, false) = false
    ORDER BY patient_schedule_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'patientschedule not found for patient %, vaccine %, dose %', p_patient_id, p_vaccine_id, p_dose_number;
    END IF;

    RETURN QUERY SELECT * FROM public.debug_reschedule_trace(v_ps_id, p_new_date, p_user_id);
END;
$$;

-- 5) Debug wrapper: returns DB-made decisions and changed rows as JSON
CREATE OR REPLACE FUNCTION public.debug_reschedule_trace(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint DEFAULT NULL
)
RETURNS TABLE (
    trace jsonb,
    changes jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_changes jsonb;
BEGIN
    -- Create temp trace table for this session
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_reschedule_trace (
        id bigserial primary key,
        phase text,
        candidate_date date,
        rule text,
        decision text,
        context jsonb
    ) ON COMMIT DROP;

    -- Run the recursive rescheduler and collect changed rows
    WITH r AS (
        SELECT * FROM reschedule_patientschedule_recursive(p_patient_schedule_id, p_new_date, p_user_id, 200)
    )
    SELECT COALESCE(json_agg(to_jsonb(r.*) ORDER BY r.patient_schedule_id), '[]'::jsonb)
    INTO v_changes
    FROM r;

    -- Return one row with the trace and changes payloads
    RETURN QUERY
    SELECT 
        COALESCE((SELECT json_agg(to_jsonb(t) ORDER BY t.id) FROM pg_temp.tmp_reschedule_trace t), '[]'::jsonb) AS trace,
        v_changes AS changes;
END;
$$;

-- 5b) Subject-first checkpoints debugger: ordered pass/fail with context
CREATE OR REPLACE FUNCTION public.debug_reschedule_checkpoints(
    p_patient_schedule_id bigint,
    p_new_date date
)
RETURNS TABLE (
    rule text,
    passed boolean,
    detail jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    s RECORD;
    v_dob date;
    v_due_after int;
    v_min_same int;
    v_max_same int;
    v_min_other int;
    v_concurrent boolean;
    v_prev_ref date;
    v_baseline_due date;
    v_candidate date := p_new_date;
    v_has_same_day boolean;
    v_other_same_day_conflict boolean;
    v_nearest_other date;
    v_other_concurrent boolean;
    v_other_diff int;
BEGIN
    SELECT * INTO s FROM patientschedule ps WHERE ps.patient_schedule_id = p_patient_schedule_id AND COALESCE(ps.is_deleted,false) = false;
    IF NOT FOUND THEN RAISE EXCEPTION 'patientschedule % not found', p_patient_schedule_id; END IF;

    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = s.patient_id;

    SELECT sd.due_after_days, sd.min_interval_days, sd.max_interval_days, sd.min_interval_other_vax, sm.concurrent_allowed
    INTO v_due_after, v_min_same, v_max_same, v_min_other, v_concurrent
    FROM schedule_doses sd
    JOIN schedule_master sm ON sm.id = sd.schedule_id
    WHERE sm.vaccine_id = s.vaccine_id AND sd.dose_number = s.dose_number
    LIMIT 1;

    IF v_dob IS NOT NULL AND v_due_after IS NOT NULL THEN
        v_baseline_due := (v_dob + (v_due_after * INTERVAL '1 day'))::date;
    END IF;

    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_prev_ref
    FROM patientschedule ps
    WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number < s.dose_number AND COALESCE(ps.is_deleted,false) = false;

    -- 1) DAD baseline
    RETURN QUERY SELECT 'dad_baseline', (v_baseline_due IS NULL OR v_candidate >= v_baseline_due),
        json_build_object('dob', v_dob, 'due_after_days', v_due_after, 'baseline_due', v_baseline_due, 'candidate', v_candidate)::jsonb;

    -- 2) DAD sync (conditional): only necessary if a DAD peer would violate its own min_interval_other_vax relative to candidate (ignoring same-day when both concurrent)
    RETURN QUERY
    WITH subj AS (
        SELECT sm.concurrent_allowed AS subj_conc
        FROM schedule_master sm
        WHERE sm.vaccine_id = s.vaccine_id
        LIMIT 1
    ), peers AS (
        SELECT ps.patient_schedule_id,
               COALESCE(ps.actual_date, ps.scheduled_date)::date AS peer_date,
               sm2.concurrent_allowed AS peer_conc,
               sd2.min_interval_other_vax AS peer_min_other
        FROM patientschedule ps
        JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
        JOIN schedule_doses sd2 ON sd2.schedule_id = sm2.id AND sd2.dose_number = ps.dose_number
        WHERE ps.patient_id = s.patient_id
          AND ps.vaccine_id <> s.vaccine_id
          AND COALESCE(ps.is_deleted,false) = false
          AND ps.actual_date IS NULL
          AND sd2.due_after_days = v_due_after
    ), need_sync AS (
        SELECT COUNT(*) AS cnt
        FROM peers p, subj
        WHERE p.peer_min_other IS NOT NULL
          AND (
                (ABS(p.peer_date - v_candidate) < p.peer_min_other)
                AND NOT (ABS(p.peer_date - v_candidate) = 0 AND COALESCE(p.peer_conc,false) AND COALESCE(subj.subj_conc,false))
              )
    )
    SELECT 'dad_sync',
           ((SELECT cnt FROM need_sync) = 0),
           json_build_object(
               'peer_count', (SELECT COUNT(*) FROM peers),
               'need_sync_count', (SELECT cnt FROM need_sync),
               'candidate', v_candidate
           )::jsonb;

    -- 3) Same-vaccine min_interval_days
    RETURN QUERY SELECT 'min_interval_same', (v_prev_ref IS NULL OR v_min_same IS NULL OR v_candidate >= (v_prev_ref + (v_min_same * INTERVAL '1 day'))::date),
        json_build_object('prev_ref', v_prev_ref, 'min_days', v_min_same, 'candidate', v_candidate)::jsonb;

    -- 4) Same-vaccine max_interval_days
    RETURN QUERY SELECT 'max_interval_same', (v_prev_ref IS NULL OR v_max_same IS NULL OR v_candidate <= (v_prev_ref + (v_max_same * INTERVAL '1 day'))::date),
        json_build_object('prev_ref', v_prev_ref, 'max_days', v_max_same, 'candidate', v_candidate)::jsonb;

    -- 5) Same vaccine same-day prohibition
    SELECT EXISTS (
        SELECT 1 FROM patientschedule ps
        WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number <> s.dose_number
          AND COALESCE(ps.is_deleted,false) = false AND COALESCE(ps.actual_date, ps.scheduled_date)::date = v_candidate
    ) INTO v_has_same_day;
    RETURN QUERY SELECT 'same_vaccine_same_day', NOT v_has_same_day, json_build_object('candidate', v_candidate)::jsonb;

    -- 6) Same-day concurrency symmetry
    SELECT EXISTS (
        SELECT 1
        FROM patientschedule ps
        JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
        WHERE ps.patient_id = s.patient_id AND ps.vaccine_id <> s.vaccine_id
          AND COALESCE(ps.is_deleted,false) = false AND COALESCE(ps.actual_date, ps.scheduled_date)::date = v_candidate
          AND NOT (COALESCE(v_concurrent,false) AND COALESCE(sm2.concurrent_allowed,false))
    ) INTO v_other_same_day_conflict;
    RETURN QUERY SELECT 'same_day_concurrency', NOT v_other_same_day_conflict, json_build_object('candidate', v_candidate)::jsonb;

    -- 7) Cross-vaccine minimum spacing
    IF v_min_other IS NOT NULL THEN
        SELECT COALESCE(ps.actual_date, ps.scheduled_date)::date AS odate, sm2.concurrent_allowed
        INTO v_nearest_other, v_other_concurrent
        FROM patientschedule ps
        JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
        WHERE ps.patient_id = s.patient_id AND ps.vaccine_id <> s.vaccine_id AND COALESCE(ps.is_deleted,false) = false
        ORDER BY ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - v_candidate)
        LIMIT 1;

        IF v_nearest_other IS NOT NULL THEN
            v_other_diff := ABS(v_candidate - v_nearest_other);
            IF v_other_diff = 0 THEN
                IF COALESCE(v_concurrent,false) AND COALESCE(v_other_concurrent,false) THEN
                    RETURN QUERY SELECT 'min_interval_other_vax', true, json_build_object('other_date', v_nearest_other, 'min_days', v_min_other, 'diff_days', v_other_diff, 'note', 'same-day allowed by both')::jsonb;
                ELSE
                    RETURN QUERY SELECT 'min_interval_other_vax', false, json_build_object('other_date', v_nearest_other, 'diff_days', v_other_diff, 'reason', 'same-day disallowed by concurrency')::jsonb;
                END IF;
            ELSIF v_other_diff < v_min_other THEN
                RETURN QUERY SELECT 'min_interval_other_vax', false, json_build_object('other_date', v_nearest_other, 'diff_days', v_other_diff, 'min_days', v_min_other)::jsonb;
            ELSE
                RETURN QUERY SELECT 'min_interval_other_vax', true, json_build_object('other_date', v_nearest_other, 'diff_days', v_other_diff, 'min_days', v_min_other)::jsonb;
            END IF;
        ELSE
            RETURN QUERY SELECT 'min_interval_other_vax', true, json_build_object('min_days', v_min_other, 'note', 'no other vaccines scheduled')::jsonb;
        END IF;
    ELSE
        RETURN QUERY SELECT 'min_interval_other_vax', true, json_build_object('note', 'no cross-vax minimum configured')::jsonb;
    END IF;
END;
$$;

-- 4) Smart manual reschedule with age/feasibility validation and warnings
-- Clean up older overload to avoid PostgREST ambiguity
DROP FUNCTION IF EXISTS public.smart_reschedule_patientschedule(bigint, date, bigint, boolean);
CREATE OR REPLACE FUNCTION public.smart_reschedule_patientschedule(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint DEFAULT NULL,
    p_force_override boolean DEFAULT false,
    p_cascade boolean DEFAULT false
)
RETURNS TABLE (
    out_patient_schedule_id bigint,
    final_scheduled_date date,
    warning text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    s RECORD;
    v_dob DATE;
    v_min_age INTEGER;
    v_max_age INTEGER;
    v_candidate DATE := p_new_date;
    v_finish DATE;
    v_warning TEXT := NULL;
    v_prev_ps_id bigint;
    v_prev_ref DATE;
    v_prev_has_actual boolean := false;
    v_next_ps_id bigint;
    v_next_ref DATE;
    v_next_has_actual boolean := false;
    v_next_min INTEGER;
    v_next_max INTEGER;
    v_min_same INTEGER;
    v_max_same INTEGER;
    v_min_rest INTEGER;
    v_min_other_self INTEGER;
    v_due_after INTEGER;
    v_baseline_due DATE;
BEGIN
    -- Load target schedule and age bounds
        SELECT * INTO s
        FROM patientschedule ps
        WHERE ps.patient_schedule_id = p_patient_schedule_id
            AND COALESCE(ps.is_deleted,false) = false
        FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'patientschedule % not found', p_patient_schedule_id; END IF;

    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = s.patient_id;

    SELECT sm.min_age_days, sm.max_age_days
    INTO v_min_age, v_max_age
    FROM schedule_master sm
    WHERE sm.vaccine_id = s.vaccine_id
    LIMIT 1;

    -- Same-vaccine interval bounds for hard-stop on max interval
    -- Capture the previous dose row (if any) and whether it has an actual_date (completed)
    SELECT ps.patient_schedule_id, COALESCE(ps.actual_date, ps.scheduled_date) AS ref_date, (ps.actual_date IS NOT NULL) AS has_actual
    INTO v_prev_ps_id, v_prev_ref, v_prev_has_actual
    FROM patientschedule ps
    WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number < s.dose_number AND COALESCE(ps.is_deleted,false) = false
    ORDER BY COALESCE(ps.actual_date, ps.scheduled_date) DESC
    LIMIT 1;

    -- Also capture the next dose (if any) to ensure we don't violate intervals relative to a completed later dose
    SELECT ps.patient_schedule_id, COALESCE(ps.actual_date, ps.scheduled_date) AS ref_date, (ps.actual_date IS NOT NULL) AS has_actual
    INTO v_next_ps_id, v_next_ref, v_next_has_actual
    FROM patientschedule ps
    WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number > s.dose_number AND COALESCE(ps.is_deleted,false) = false
    ORDER BY COALESCE(ps.actual_date, ps.scheduled_date) ASC
    LIMIT 1;

    -- If there's a concrete next-dose, read its min/max interval (from perspective of previous dose)
    IF v_next_ps_id IS NOT NULL THEN
        SELECT sd.min_interval_days, sd.max_interval_days INTO v_next_min, v_next_max
        FROM schedule_doses sd
        JOIN schedule_master sm ON sm.id = sd.schedule_id
        WHERE sm.vaccine_id = s.vaccine_id AND sd.dose_number = s.dose_number + 1
        LIMIT 1;
    END IF;
    SELECT sd.min_interval_days, sd.max_interval_days, sd.due_after_days, sd.min_interval_other_vax INTO v_min_same, v_max_same, v_due_after, v_min_other_self
    FROM schedule_doses sd JOIN schedule_master sm ON sm.id = sd.schedule_id
    WHERE sm.vaccine_id = s.vaccine_id AND sd.dose_number = s.dose_number
    LIMIT 1;

    IF v_dob IS NOT NULL AND v_due_after IS NOT NULL THEN
        v_baseline_due := (v_dob + (v_due_after * INTERVAL '1 day'))::date;
    END IF;

    -- Soft min-age check (typically applies to first dose)
    IF v_min_age IS NOT NULL AND s.dose_number = 1 AND v_dob IS NOT NULL THEN
        IF v_candidate < (v_dob + (v_min_age * INTERVAL '1 day'))::date THEN
            v_warning := COALESCE(v_warning, '') || format('Below min_age_days (%s days).', v_min_age);
            -- Proceed regardless (soft). Frontend can re-call with p_force_override=true if they want to acknowledge.
        END IF;
    END IF;

    -- Feasibility hard check against max_age_days: can we finish series if we start here using only min intervals?
    IF v_max_age IS NOT NULL AND v_dob IS NOT NULL THEN
        SELECT COALESCE(SUM(COALESCE(sd.min_interval_days,0)),0)
        INTO v_min_rest
        FROM schedule_doses sd
        JOIN schedule_master sm ON sm.id = sd.schedule_id
        WHERE sm.vaccine_id = s.vaccine_id AND sd.dose_number > s.dose_number;

        v_finish := (v_candidate + (v_min_rest * INTERVAL '1 day'))::date;
        IF v_finish > (v_dob + (v_max_age * INTERVAL '1 day'))::date THEN
            RAISE EXCEPTION 'Series completion exceeds max_age_days (%). Earliest finish: %, deadline: %.', v_max_age, v_finish, (v_dob + (v_max_age * INTERVAL '1 day'))::date;
        END IF;
    END IF;

    -- Hard-stop: if requested date exceeds same-vaccine max interval bound, block manual reschedule
    IF v_prev_ref IS NOT NULL AND v_max_same IS NOT NULL THEN
        IF v_candidate > (v_prev_ref + (v_max_same * INTERVAL '1 day'))::date THEN
            RAISE EXCEPTION 'Cannot schedule beyond max_interval_days window (% days from previous dose).', v_max_same;
        END IF;
    END IF;

    -- Subject-first: by default, update only the requested schedule; cascade is optional
    IF p_cascade THEN
        -- Delegate to DFS rescheduler which auto-adjusts across related schedules until valid
        RETURN QUERY
        WITH res AS (
            SELECT * FROM reschedule_patientschedule_dfs(p_patient_schedule_id, v_candidate, p_user_id, 200, 'full')
        )
        SELECT r.patient_schedule_id AS out_patient_schedule_id,
               r.scheduled_date AS final_scheduled_date,
               NULLIF(
                   trim(BOTH ' |' FROM (
                       COALESCE(v_warning,'') ||
                       CASE WHEN (
                               SELECT scheduled_date FROM res rs WHERE rs.patient_schedule_id = p_patient_schedule_id LIMIT 1
                           ) IS DISTINCT FROM v_candidate
                           THEN CASE WHEN v_warning IS NULL THEN '' ELSE ' | ' END || 'Adjusted by DFS to maintain intervals/spacing' ELSE '' END
                   )), ''
               ) AS warning
        FROM res r;
    ELSE
        -- Subject-first strict mode: no silent adjust. Validate candidate against constraints.
        -- 0) DAD baseline hard check first
        IF v_baseline_due IS NOT NULL AND v_candidate < v_baseline_due THEN
            RAISE EXCEPTION 'PS:% V:% D:% — Requested date (%) cannot be earlier than baseline due_after_days (%).',
                s.patient_schedule_id, s.vaccine_id, s.dose_number, v_candidate, v_baseline_due;
        END IF;
        -- 0.1) DAD Sync soft check (conditional): only warn if a DAD peer would violate its own min_interval_other_vax relative to the candidate date (and same-day not allowed by concurrency)
        -- However, if the peer that would be violated already has an actual_date (completed), escalate to a hard error.
        IF v_due_after IS NOT NULL THEN
            -- Hard error: a completed DAD peer would be violated
            IF EXISTS (
                WITH subj AS (
                    SELECT sm.concurrent_allowed AS subj_conc
                    FROM schedule_master sm WHERE sm.vaccine_id = s.vaccine_id LIMIT 1
                )
                SELECT 1
                FROM patientschedule ps_gm
                JOIN schedule_master sm_gm ON sm_gm.vaccine_id = ps_gm.vaccine_id
                JOIN schedule_doses sd_gm ON sd_gm.schedule_id = sm_gm.id AND sd_gm.dose_number = ps_gm.dose_number
                CROSS JOIN subj
                WHERE ps_gm.patient_id = s.patient_id
                  AND ps_gm.vaccine_id <> s.vaccine_id
                  AND COALESCE(ps_gm.is_deleted,false) = false
                  AND ps_gm.actual_date IS NOT NULL
                  AND sd_gm.due_after_days = v_due_after
                  AND sd_gm.min_interval_other_vax IS NOT NULL
                  AND (
                        ABS(COALESCE(ps_gm.actual_date, ps_gm.scheduled_date)::date - v_candidate) < sd_gm.min_interval_other_vax
                        AND NOT (
                            COALESCE(ps_gm.actual_date, ps_gm.scheduled_date)::date = v_candidate
                            AND COALESCE(sm_gm.concurrent_allowed,false) AND COALESCE(subj.subj_conc,false)
                        )
                  )
            ) THEN
                RAISE EXCEPTION 'DAD peer with an actual/recorded date would be violated by requested date %; operation blocked.', v_candidate;
            END IF;

            -- Soft warning: peers without actual_date may be adjusted by cascade
            IF EXISTS (
                WITH subj AS (
                    SELECT sm.concurrent_allowed AS subj_conc
                    FROM schedule_master sm WHERE sm.vaccine_id = s.vaccine_id LIMIT 1
                )
                SELECT 1
                FROM patientschedule ps_gm
                JOIN schedule_master sm_gm ON sm_gm.vaccine_id = ps_gm.vaccine_id
                JOIN schedule_doses sd_gm ON sd_gm.schedule_id = sm_gm.id AND sd_gm.dose_number = ps_gm.dose_number
                CROSS JOIN subj
                WHERE ps_gm.patient_id = s.patient_id
                  AND ps_gm.vaccine_id <> s.vaccine_id
                  AND COALESCE(ps_gm.is_deleted,false) = false
                  AND ps_gm.actual_date IS NULL
                  AND sd_gm.due_after_days = v_due_after
                  AND sd_gm.min_interval_other_vax IS NOT NULL
                  AND (
                        ABS(COALESCE(ps_gm.actual_date, ps_gm.scheduled_date)::date - v_candidate) < sd_gm.min_interval_other_vax
                        AND NOT (
                            COALESCE(ps_gm.actual_date, ps_gm.scheduled_date)::date = v_candidate
                            AND COALESCE(sm_gm.concurrent_allowed,false) AND COALESCE(subj.subj_conc,false)
                        )
                  )
            ) THEN
                RETURN QUERY SELECT s.patient_schedule_id AS out_patient_schedule_id,
                                     s.scheduled_date     AS final_scheduled_date,
                                     format('DAD peers: a peer would violate min_interval_other_vax relative to %s. Continue to cascade to synchronize only the necessary peers, or Cancel to keep the original date.', v_candidate)::text AS warning;
                RETURN;
            END IF;
        END IF;
        -- 1) Same-vaccine interval bounds relative to previous dose
        IF v_prev_ref IS NOT NULL THEN
            IF v_min_same IS NOT NULL AND v_candidate < (v_prev_ref + (v_min_same * INTERVAL '1 day'))::date THEN
                IF v_prev_has_actual THEN
                    -- If previous dose is completed/recorded, this is a hard violation
                    RAISE EXCEPTION 'Cannot schedule earlier than min_interval_days (%s days) from completed previous dose on %s.', v_min_same, v_prev_ref;
                ELSE
                    RETURN QUERY SELECT s.patient_schedule_id AS out_patient_schedule_id,
                                         s.scheduled_date     AS final_scheduled_date,
                                         format('Earlier than min_interval_days (%s days) from previous dose on %s. Continue to cascade and auto-adjust next doses, or Cancel to keep original date.', v_min_same, v_prev_ref)::text AS warning;
                    RETURN;
                END IF;
            END IF;
            IF v_max_same IS NOT NULL AND v_candidate > (v_prev_ref + (v_max_same * INTERVAL '1 day'))::date THEN
                IF v_prev_has_actual THEN
                    RAISE EXCEPTION 'Cannot schedule beyond max_interval_days (%s days) from previous dose on %s.', v_max_same, v_prev_ref;
                ELSE
                    RETURN QUERY SELECT s.patient_schedule_id AS out_patient_schedule_id,
                                         s.scheduled_date     AS final_scheduled_date,
                                         format('Exceeds max_interval_days (%s days) from previous dose on %s. Continue to cascade and reflow the series, or Cancel to keep original date.', v_max_same, v_prev_ref)::text AS warning;
                    RETURN;
                END IF;
            END IF;
        END IF;

        -- 1.1) Also ensure we don't violate constraints relative to a completed next dose (if any)
        IF v_next_ref IS NOT NULL AND v_next_has_actual THEN
            -- The requested date must be at least next_min days before the next completed dose
            IF v_next_min IS NOT NULL AND v_candidate > (v_next_ref - (v_next_min * INTERVAL '1 day'))::date THEN
                RAISE EXCEPTION 'Requested date %s would be too close to completed subsequent dose on %s (min_interval_days %s).', v_candidate, v_next_ref, v_next_min;
            END IF;
            IF v_next_max IS NOT NULL AND v_candidate < (v_next_ref - (v_next_max * INTERVAL '1 day'))::date THEN
                RAISE EXCEPTION 'Requested date %s would be earlier than allowed relative to completed subsequent dose on %s (max_interval_days %s).', v_candidate, v_next_ref, v_next_max;
            END IF;
        END IF;

        -- 2) Same-vaccine same-day prohibition (soft)
        IF EXISTS (
            SELECT 1 FROM patientschedule ps
            WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number <> s.dose_number
              AND COALESCE(ps.is_deleted,false) = false AND ps.scheduled_date = v_candidate
        ) THEN
            RETURN QUERY SELECT s.patient_schedule_id AS out_patient_schedule_id,
                                 s.scheduled_date     AS final_scheduled_date,
                                 format('Same vaccine same-day not allowed (%s). Continue to cascade and push later dose forward, or Cancel to keep original date.', v_candidate)::text AS warning;
            RETURN;
        END IF;

        -- 3) Concurrency symmetry: any other vaccine scheduled same day must have both concurrent_allowed
        -- Soft warning (no update) in strict/no-cascade mode so UI can decide to cascade or revert
        IF EXISTS (
            SELECT 1
            FROM patientschedule ps
            JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
            WHERE ps.patient_id = s.patient_id AND ps.vaccine_id <> s.vaccine_id
              AND COALESCE(ps.is_deleted,false) = false AND ps.scheduled_date = v_candidate
              AND NOT (COALESCE((SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = s.vaccine_id LIMIT 1),false) AND COALESCE(sm2.concurrent_allowed,false))
        ) THEN
            RETURN QUERY SELECT s.patient_schedule_id AS out_patient_schedule_id,
                                 s.scheduled_date     AS final_scheduled_date,
                                 format('Same-day concurrency disallowed by one of the vaccines on %s. Choose Continue to cascade and adjust peers, or Cancel to keep the original date.', v_candidate)::text AS warning;
            RETURN;
        END IF;

        -- 5) Cross-vaccine minimum spacing: escalate to hard error if the conflicting schedule is recorded (actual_date), otherwise soft-warning
        IF v_min_other_self IS NOT NULL THEN
            -- Hard error: a recorded/actual schedule would be violated
            IF EXISTS (
                SELECT 1
                FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                WHERE ps.patient_id = s.patient_id
                  AND ps.vaccine_id <> s.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.actual_date IS NOT NULL
                  AND (
                        ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - v_candidate) < v_min_other_self
                        AND NOT (
                            (COALESCE(ps.actual_date, ps.scheduled_date))::date = v_candidate
                            AND COALESCE((SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = s.vaccine_id LIMIT 1),false)
                            AND COALESCE(sm2.concurrent_allowed,false)
                        )
                      )
            ) THEN
                RAISE EXCEPTION 'Requested date %s would violate min_interval_other_vax relative to a recorded dose; operation blocked.', v_candidate;
            END IF;

            -- Soft warning: peers without actual_date may be adjusted by cascade
            IF EXISTS (
                SELECT 1
                FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                WHERE ps.patient_id = s.patient_id
                  AND ps.vaccine_id <> s.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND (
                        ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - v_candidate) < v_min_other_self
                        AND NOT (
                            (COALESCE(ps.actual_date, ps.scheduled_date))::date = v_candidate
                            AND COALESCE((SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = s.vaccine_id LIMIT 1),false)
                            AND COALESCE(sm2.concurrent_allowed,false)
                        )
                      )
            ) THEN
                RETURN QUERY SELECT s.patient_schedule_id AS out_patient_schedule_id,
                                     s.scheduled_date     AS final_scheduled_date,
                                     format('Requested date %s violates min_interval_other_vax relative to nearby schedules. Choose Continue to cascade and auto-adjust affected schedules, or Cancel to keep the original date.', v_candidate)::text AS warning;
                RETURN;
            END IF;
        END IF;

        -- All clear: apply without cascade/group and without adjustment
        RETURN QUERY
        WITH res AS (
            SELECT * FROM public.reschedule_patientschedule(p_patient_schedule_id, v_candidate, p_user_id, false, false, true)
        )
        SELECT r.patient_schedule_id AS out_patient_schedule_id,
               r.scheduled_date AS final_scheduled_date,
               COALESCE(v_warning, NULL) AS warning
        FROM res r;
    END IF;
END;
$$;

-- 6b) DFS-based rescheduler: depth-first traversal and adjustments
CREATE OR REPLACE FUNCTION public.reschedule_patientschedule_dfs(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint DEFAULT NULL,
    p_max_depth integer DEFAULT 200,
    p_mode text DEFAULT 'dad-only' -- 'dad-only' or 'full'
)
RETURNS SETOF patientschedule
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_depth int := 0;
    cur RECORD;
    c RECORD;
    s RECORD;
    v_has_trace boolean := false;
BEGIN
    -- Mark session as DFS to relax trigger checks during the orchestration
    PERFORM set_config('app.reschedule_ctx', 'dfs', true);
    -- temp structures: stack (LIFO), processed per (node, req_date), changed
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_stack (
        id bigserial primary key,
        patient_schedule_id bigint,
        req_date date
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_processed (
        patient_schedule_id bigint,
        req_date date,
        PRIMARY KEY(patient_schedule_id, req_date)
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_changed (
        patient_schedule_id bigint primary key
    ) ON COMMIT DROP;
    -- temp: deduplicate enqueue logs per (ps_id, anchor_date, kind)
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_logged_enqueue (
        patient_schedule_id bigint,
        anchor_date date,
        kind text,
        logged boolean DEFAULT false,
        PRIMARY KEY(patient_schedule_id, anchor_date, kind)
    ) ON COMMIT DROP;

    -- Optional trace table
    SELECT to_regclass('pg_temp.tmp_reschedule_trace') IS NOT NULL INTO v_has_trace;
    IF NOT v_has_trace THEN
        CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_reschedule_trace (
            id bigserial primary key,
            phase text,
            candidate_date date,
            rule text,
            decision text,
            context jsonb
        ) ON COMMIT DROP;
        v_has_trace := true;
    END IF;

    -- seed stack with subject
    INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
    VALUES (p_patient_schedule_id, p_new_date);

    WHILE (SELECT COUNT(*) FROM pg_temp.tmp_dfs_stack) > 0 AND v_depth < p_max_depth LOOP
        v_depth := v_depth + 1;
        -- pop last pushed item (LIFO)
        SELECT patient_schedule_id, req_date INTO cur
        FROM pg_temp.tmp_dfs_stack
        ORDER BY id DESC
        LIMIT 1;
        DELETE FROM pg_temp.tmp_dfs_stack WHERE id = (SELECT MAX(id) FROM pg_temp.tmp_dfs_stack);

        -- skip if already processed with the same requested date (allow re-visit if req_date changes later)
        IF EXISTS (
            SELECT 1 FROM pg_temp.tmp_dfs_processed
            WHERE patient_schedule_id = cur.patient_schedule_id AND req_date = cur.req_date
        ) THEN
            CONTINUE;
        END IF;
        INSERT INTO pg_temp.tmp_dfs_processed(patient_schedule_id, req_date)
        VALUES (cur.patient_schedule_id, cur.req_date)
        ON CONFLICT DO NOTHING;

        -- apply core reschedule for this node (subject-first update and group move)
        FOR c IN
            SELECT * FROM public.reschedule_patientschedule(cur.patient_schedule_id, cur.req_date, p_user_id, false, true, true)
        LOOP
        INSERT INTO pg_temp.tmp_dfs_changed(patient_schedule_id) VALUES (c.patient_schedule_id)
            ON CONFLICT DO NOTHING;
        -- Temporary logging of DFS visit (best-effort; ignore if action_type is not allowed)
        BEGIN
            INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
            VALUES ('DFS_VISIT', p_user_id, 'patientschedule', c.patient_schedule_id,
                'DFS applied node', CURRENT_TIMESTAMP);
        EXCEPTION WHEN OTHERS THEN
            -- ignore
        END;
            IF v_has_trace THEN
                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                VALUES ('dfs-visit', c.scheduled_date, 'apply_node', 'update', json_build_object('patient_schedule_id', c.patient_schedule_id));
            END IF;

            -- neighbors (DFS order): DAD peers -> next dose -> cross-vax conflicts
            -- DAD peers: only enqueue when peer would violate its own min_interval_other_vax relative to c.scheduled_date and same-day not allowed by concurrency
            WITH subj AS (
                SELECT sd.due_after_days AS dad, sm.concurrent_allowed AS subj_conc
                FROM schedule_doses sd JOIN schedule_master sm ON sm.id = sd.schedule_id
                WHERE sm.vaccine_id = c.vaccine_id AND sd.dose_number = c.dose_number
                LIMIT 1
            ), peers AS (
                SELECT ps.patient_schedule_id,
                       COALESCE(ps.actual_date, ps.scheduled_date)::date AS cur_date,
                       (SELECT date_of_birth FROM patients WHERE patient_id = ps.patient_id) AS dob,
                       sd2.due_after_days AS dad,
                       sd2.min_interval_other_vax AS p_min_other,
                       sm2.concurrent_allowed AS p_conc
                FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                JOIN schedule_doses sd2 ON sd2.schedule_id = sm2.id AND sd2.dose_number = ps.dose_number
                WHERE ps.patient_id = c.patient_id
                  AND ps.vaccine_id <> c.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.actual_date IS NULL
                  AND sd2.due_after_days = (SELECT dad FROM subj)
            )
            INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
            SELECT peer1.patient_schedule_id,
                   GREATEST(
                       c.scheduled_date,
                       COALESCE((peer1.dob + (peer1.dad * INTERVAL '1 day'))::date, c.scheduled_date)
                   )
            FROM peers peer1, subj
            WHERE peer1.p_min_other IS NOT NULL
              AND (
                    ABS(peer1.cur_date - c.scheduled_date) < peer1.p_min_other
                    AND NOT (ABS(peer1.cur_date - c.scheduled_date) = 0 AND COALESCE(peer1.p_conc,false) AND COALESCE(subj.subj_conc,false))
                  )
            ON CONFLICT DO NOTHING;
            -- Log DAD peer enqueues (de-duplicated per (ps_id, anchor_date, kind))
            BEGIN
                INSERT INTO pg_temp.tmp_dfs_logged_enqueue(patient_schedule_id, anchor_date, kind)
                SELECT peer1.patient_schedule_id, c.scheduled_date, 'dad_peer'
                FROM (
                    SELECT p.patient_schedule_id
                    FROM (
                        SELECT ps.patient_schedule_id,
                               COALESCE(ps.actual_date, ps.scheduled_date)::date AS cur_date,
                               sd2.min_interval_other_vax AS p_min_other,
                               sm2.concurrent_allowed AS p_conc,
                               (SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = c.vaccine_id LIMIT 1) AS subj_conc
                        FROM patientschedule ps
                        JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                        JOIN schedule_doses sd2 ON sd2.schedule_id = sm2.id AND sd2.dose_number = ps.dose_number
                        WHERE ps.patient_id = c.patient_id
                          AND ps.vaccine_id <> c.vaccine_id
                          AND COALESCE(ps.is_deleted,false) = false
                          AND ps.actual_date IS NULL
                          AND sd2.due_after_days = (SELECT sd.due_after_days FROM schedule_doses sd JOIN schedule_master sm ON sm.id = sd.schedule_id WHERE sm.vaccine_id = c.vaccine_id AND sd.dose_number = c.dose_number LIMIT 1)
                    ) p
                    WHERE p.p_min_other IS NOT NULL
                      AND (ABS(p.cur_date - c.scheduled_date) < p.p_min_other)
                      AND NOT (ABS(p.cur_date - c.scheduled_date) = 0 AND COALESCE(p.p_conc,false) AND COALESCE(p.subj_conc,false))
                ) peer1
                ON CONFLICT DO NOTHING;
                INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
                SELECT 'DFS_ENQUEUE', p_user_id, 'patientschedule', t.patient_schedule_id,
                       format('Enqueue DAD peer due to MIOV relative to %s', c.scheduled_date), CURRENT_TIMESTAMP
                FROM pg_temp.tmp_dfs_logged_enqueue t
                WHERE t.anchor_date = c.scheduled_date AND t.kind = 'dad_peer' AND t.logged = false;
                UPDATE pg_temp.tmp_dfs_logged_enqueue
                SET logged = true
                WHERE anchor_date = c.scheduled_date AND kind = 'dad_peer' AND logged = false;
            EXCEPTION WHEN OTHERS THEN
                -- ignore
            END;
            
            -- Next dose of same vaccine: only when in 'full' mode
            IF p_mode = 'full' THEN
                WITH meta AS (
                    SELECT sd.min_interval_days AS n_min,
                           sd.due_after_days AS n_dad
                    FROM schedule_doses sd JOIN schedule_master sm ON sm.id = sd.schedule_id
                    WHERE sm.vaccine_id = c.vaccine_id AND sd.dose_number = c.dose_number + 1
                    LIMIT 1
                ), nxt AS (
                    SELECT ps.* FROM patientschedule ps
                    WHERE ps.patient_id = c.patient_id AND ps.vaccine_id = c.vaccine_id AND ps.dose_number = c.dose_number + 1 AND COALESCE(ps.is_deleted,false) = false
                )
                INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
                SELECT n.patient_schedule_id,
                        GREATEST(
                            (c.scheduled_date + (GREATEST(COALESCE(m.n_min, 1), 1) * INTERVAL '1 day'))::date,
                            COALESCE(((SELECT date_of_birth FROM patients WHERE patient_id = c.patient_id) + (COALESCE(m.n_dad,0) * INTERVAL '1 day'))::date,
                                     (c.scheduled_date + (GREATEST(COALESCE(m.n_min, 1), 1) * INTERVAL '1 day'))::date)
                        )
                                FROM nxt n CROSS JOIN meta m
                                WHERE n.actual_date IS NULL
                  AND (
                        -- enqueue if next is same-day or earlier than allowed min interval; when min is null, treat 1-day separation as default
                        (n.scheduled_date <= (c.scheduled_date + (GREATEST(COALESCE(m.n_min, 1), 1) * INTERVAL '1 day'))::date)
                     OR (m.n_dad IS NOT NULL AND n.scheduled_date < ((SELECT date_of_birth FROM patients WHERE patient_id = c.patient_id) + (m.n_dad * INTERVAL '1 day'))::date)
                  )
                ON CONFLICT DO NOTHING;
                -- Log next-dose enqueues (best-effort)
                BEGIN
                    INSERT INTO pg_temp.tmp_dfs_logged_enqueue(patient_schedule_id, anchor_date, kind)
                    SELECT ps.patient_schedule_id, c.scheduled_date, 'next_dose'
                    FROM patientschedule ps
                    WHERE ps.patient_id = c.patient_id AND ps.vaccine_id = c.vaccine_id AND ps.dose_number = c.dose_number + 1 AND COALESCE(ps.is_deleted,false) = false
                    ON CONFLICT DO NOTHING;
                    INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
                    SELECT 'DFS_ENQUEUE', p_user_id, 'patientschedule', t.patient_schedule_id,
                           format('Enqueue next-dose (min + DAD baseline) from %s', c.scheduled_date), CURRENT_TIMESTAMP
                    FROM pg_temp.tmp_dfs_logged_enqueue t
                    WHERE t.anchor_date = c.scheduled_date AND t.kind = 'next_dose' AND t.logged = false;
                    UPDATE pg_temp.tmp_dfs_logged_enqueue
                    SET logged = true
                    WHERE anchor_date = c.scheduled_date AND kind = 'next_dose' AND logged = false;
                EXCEPTION WHEN OTHERS THEN
                    -- ignore
                END;
            END IF;

            -- Cross-vax conflicts: only when in 'full' mode
            IF p_mode = 'full' THEN
                WITH neigh AS (
                    SELECT ps.patient_schedule_id,
                           sd2.min_interval_other_vax AS other_min,
                           sd2.due_after_days AS other_dad,
                           (SELECT date_of_birth FROM patients WHERE patient_id = ps.patient_id) AS dob,
                           sm2.concurrent_allowed AS other_conc,
                           (SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = c.vaccine_id LIMIT 1) AS subj_conc
                    FROM patientschedule ps
                    JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                    JOIN schedule_doses sd2 ON sd2.schedule_id = sm2.id AND sd2.dose_number = ps.dose_number
                    WHERE ps.patient_id = c.patient_id AND ps.vaccine_id <> c.vaccine_id AND COALESCE(ps.is_deleted,false) = false AND ps.actual_date IS NULL
                )
                INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
                SELECT nn.patient_schedule_id,
                       CASE
                           WHEN COALESCE(nn.subj_conc,false) AND COALESCE(nn.other_conc,false) THEN
                               -- Prefer same-day if baseline allows; else enforce min interval from subject date
                               CASE
                                   WHEN COALESCE((nn.dob + (COALESCE(nn.other_dad,0) * INTERVAL '1 day'))::date, c.scheduled_date) <= c.scheduled_date
                                       THEN c.scheduled_date
                                   ELSE GREATEST(
                                           (c.scheduled_date + (COALESCE(nn.other_min, 0) * INTERVAL '1 day'))::date,
                                           COALESCE((nn.dob + (COALESCE(nn.other_dad,0) * INTERVAL '1 day'))::date,
                                                    (c.scheduled_date + (COALESCE(nn.other_min, 0) * INTERVAL '1 day'))::date)
                                       )
                               END
                           ELSE
                               GREATEST(
                                   (c.scheduled_date + (COALESCE(nn.other_min, 0) * INTERVAL '1 day'))::date,
                                   COALESCE((nn.dob + (COALESCE(nn.other_dad,0) * INTERVAL '1 day'))::date,
                                            (c.scheduled_date + (COALESCE(nn.other_min, 0) * INTERVAL '1 day'))::date)
                               )
                       END
                FROM neigh nn
                WHERE nn.other_min IS NOT NULL AND ABS((SELECT COALESCE(ps2.actual_date, ps2.scheduled_date)::date FROM patientschedule ps2 WHERE ps2.patient_schedule_id = nn.patient_schedule_id) - c.scheduled_date) < nn.other_min
                ON CONFLICT DO NOTHING;
                -- Log cross-vax enqueues (best-effort)
                BEGIN
                    INSERT INTO pg_temp.tmp_dfs_logged_enqueue(patient_schedule_id, anchor_date, kind)
                    SELECT ps.patient_schedule_id, c.scheduled_date, 'cross_vax'
                    FROM patientschedule ps
                    JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                    JOIN schedule_doses sd2 ON sd2.schedule_id = sm2.id AND sd2.dose_number = ps.dose_number
                    WHERE ps.patient_id = c.patient_id AND ps.vaccine_id <> c.vaccine_id AND COALESCE(ps.is_deleted,false) = false AND ps.actual_date IS NULL AND sd2.min_interval_other_vax IS NOT NULL
                    ON CONFLICT DO NOTHING;
                    INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
                    SELECT 'DFS_ENQUEUE', p_user_id, 'patientschedule', t.patient_schedule_id,
                           format('Enqueue cross-vax (other_min + DAD baseline) from %s', c.scheduled_date), CURRENT_TIMESTAMP
                    FROM pg_temp.tmp_dfs_logged_enqueue t
                    WHERE t.anchor_date = c.scheduled_date AND t.kind = 'cross_vax' AND t.logged = false;
                    UPDATE pg_temp.tmp_dfs_logged_enqueue
                    SET logged = true
                    WHERE anchor_date = c.scheduled_date AND kind = 'cross_vax' AND logged = false;
                EXCEPTION WHEN OTHERS THEN
                    -- ignore
                END;
            END IF;
        END LOOP;
    END LOOP;

    -- return changed rows
    RETURN QUERY SELECT * FROM patientschedule ps WHERE ps.patient_schedule_id IN (SELECT patient_schedule_id FROM pg_temp.tmp_dfs_changed);
    -- Clear DFS context
    PERFORM set_config('app.reschedule_ctx', '', true);
END;
$$;

-- 3) Align recalc on completion with new concurrency/spacing rules
CREATE OR REPLACE FUNCTION public.recalc_patient_schedule_enhanced(
    p_patient_id bigint,
    p_vaccine_id bigint,
    p_dose_number integer,
    p_actual_date date,
    p_user_id bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_next_dose integer := p_dose_number + 1;
    v_row RECORD;
    v_dob date;
    v_new_sched date;
    v_iter int;
    v_other_date date;
    v_other_conc boolean;
    v_other_diff int;
BEGIN
    -- Mark current dose as completed
    UPDATE patientschedule
      SET actual_date = p_actual_date,
          status = 'Completed',
          updated_at = now(),
          updated_by = p_user_id
    WHERE patient_id = p_patient_id AND vaccine_id = p_vaccine_id AND dose_number = p_dose_number;

    -- Get DOB for baseline
    SELECT date_of_birth INTO v_dob FROM patients WHERE patient_id = p_patient_id;

    LOOP
        -- Load next dose schedule row and rules
        SELECT ps.patient_schedule_id, ps.scheduled_date, ps.actual_date,
               sd.min_interval_days, sd.max_interval_days, sd.due_after_days, sd.min_interval_other_vax,
               sm.concurrent_allowed
        INTO v_row
        FROM patientschedule ps
        JOIN schedule_master sm ON sm.vaccine_id = ps.vaccine_id
        JOIN schedule_doses sd ON sd.schedule_id = sm.id AND sd.dose_number = ps.dose_number
        WHERE ps.patient_id = p_patient_id AND ps.vaccine_id = p_vaccine_id AND ps.dose_number = v_next_dose
        LIMIT 1;

        EXIT WHEN NOT FOUND;

        -- Only adjust if not yet taken
        IF v_row.actual_date IS NULL THEN
            -- Baseline by master: DOB + due_after_days
            v_new_sched := (v_dob + (COALESCE(v_row.due_after_days, 0) * INTERVAL '1 day'))::date;

            -- Enforce same-vax min/max interval from just-completed dose
            IF p_actual_date IS NOT NULL AND v_row.min_interval_days IS NOT NULL THEN
                IF v_new_sched < (p_actual_date + (v_row.min_interval_days * INTERVAL '1 day'))::date THEN
                    v_new_sched := (p_actual_date + (v_row.min_interval_days * INTERVAL '1 day'))::date;
                END IF;
            END IF;
            IF p_actual_date IS NOT NULL AND v_row.max_interval_days IS NOT NULL THEN
                IF v_new_sched > (p_actual_date + (v_row.max_interval_days * INTERVAL '1 day'))::date THEN
                    v_new_sched := (p_actual_date + (v_row.max_interval_days * INTERVAL '1 day'))::date;
                END IF;
            END IF;

            -- Find nearest valid date for cross-vax spacing and symmetric concurrency
            v_iter := 0;
            WHILE v_iter < 60 LOOP
                v_iter := v_iter + 1;
                -- Same vaccine: forbid any same-day with other doses (regardless of concurrency)
                IF EXISTS (
                    SELECT 1 FROM patientschedule ps
                    WHERE ps.patient_id = p_patient_id
                      AND ps.vaccine_id = p_vaccine_id
                      AND ps.dose_number <> v_next_dose
                      AND COALESCE(ps.is_deleted,false) = false
                      AND ps.scheduled_date = v_new_sched
                ) THEN
                    v_new_sched := v_new_sched + INTERVAL '1 day';
                    CONTINUE;
                END IF;
                -- Same-day concurrency: if any other vaccine on that day and either side non-concurrent, shift
                IF EXISTS (
                    SELECT 1 FROM patientschedule ps
                    JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                    WHERE ps.patient_id = p_patient_id
                      AND ps.vaccine_id <> p_vaccine_id
                      AND COALESCE(ps.is_deleted,false) = false
                      AND ps.scheduled_date = v_new_sched
                      AND NOT (COALESCE(v_row.concurrent_allowed,false) AND COALESCE(sm2.concurrent_allowed,false))
                ) THEN
                    v_new_sched := v_new_sched + INTERVAL '1 day';
                    CONTINUE;
                END IF;

                -- Cross-vax min spacing to nearest other date; allow same-day only when both concurrent
                IF v_row.min_interval_other_vax IS NOT NULL THEN
                    SELECT COALESCE(ps.actual_date, ps.scheduled_date)::date AS odate,
                           sm2.concurrent_allowed
                    INTO v_other_date, v_other_conc
                    FROM patientschedule ps
                    JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                    WHERE ps.patient_id = p_patient_id
                      AND ps.vaccine_id <> p_vaccine_id
                      AND COALESCE(ps.is_deleted,false) = false
                    ORDER BY ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - v_new_sched)
                    LIMIT 1;

                    IF v_other_date IS NOT NULL THEN
                        v_other_diff := ABS(v_new_sched - v_other_date);
                        IF v_other_diff = 0 THEN
                            IF NOT (COALESCE(v_row.concurrent_allowed,false) AND COALESCE(v_other_conc,false)) THEN
                                v_new_sched := v_new_sched + INTERVAL '1 day';
                                CONTINUE;
                            END IF;
                        ELSIF v_other_diff < v_row.min_interval_other_vax THEN
                            v_new_sched := v_new_sched + INTERVAL '1 day';
                            CONTINUE;
                        END IF;
                    END IF;
                END IF;

                EXIT; -- found valid
            END LOOP;

        -- Apply if changed; mark as Rescheduled for visibility (only for not-yet-completed rows)
        IF v_row.scheduled_date IS DISTINCT FROM v_new_sched THEN
        UPDATE patientschedule
            SET scheduled_date = v_new_sched,
            eligible_date = v_new_sched,
                status = 'Rescheduled',
                updated_at = now(),
                updated_by = p_user_id
            WHERE patient_schedule_id = v_row.patient_schedule_id
            AND v_row.actual_date IS NULL;  -- safeguard: don't override completed

                INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
                VALUES ('SCHEDULE_UPDATE', p_user_id, 'patientschedule', v_row.patient_schedule_id,
                        'Recalculated schedule to ' || v_new_sched || ' (rules applied)', CURRENT_TIMESTAMP);
            END IF;
        END IF;

        v_next_dose := v_next_dose + 1;
    END LOOP;

    PERFORM recompute_patient_schedule_statuses(p_patient_id);
END;
$$;

-- 6) Recursive rescheduler: breadth-first loop until schedule stabilizes
CREATE OR REPLACE FUNCTION public.reschedule_patientschedule_recursive(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint DEFAULT NULL,
    p_max_iterations integer DEFAULT 200
)
RETURNS SETOF patientschedule
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_iter int := 0;
    w RECORD;
    c RECORD;
    s RECORD;
BEGIN
    -- Work queue, seen set, and change accumulator
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_work_queue (
        patient_schedule_id bigint,
        req_date date,
        PRIMARY KEY(patient_schedule_id)
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_seen (
        patient_schedule_id bigint,
        PRIMARY KEY(patient_schedule_id)
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_all_changed (
        patient_schedule_id bigint PRIMARY KEY
    ) ON COMMIT DROP;

    -- Seed queue with subject
    INSERT INTO pg_temp.tmp_work_queue(patient_schedule_id, req_date)
    VALUES (p_patient_schedule_id, p_new_date)
    ON CONFLICT DO NOTHING;

    WHILE (SELECT COUNT(*) FROM pg_temp.tmp_work_queue) > 0 AND v_iter < p_max_iterations LOOP
        v_iter := v_iter + 1;

        -- Dequeue one work item
        SELECT patient_schedule_id, req_date INTO w
        FROM pg_temp.tmp_work_queue
        LIMIT 1;
        DELETE FROM pg_temp.tmp_work_queue WHERE patient_schedule_id = w.patient_schedule_id;

        -- Skip if already processed in this pass
        IF EXISTS (SELECT 1 FROM pg_temp.tmp_seen WHERE patient_schedule_id = w.patient_schedule_id) THEN
            CONTINUE;
        END IF;
        INSERT INTO pg_temp.tmp_seen(patient_schedule_id) VALUES (w.patient_schedule_id) ON CONFLICT DO NOTHING;

        -- Apply core reschedule for this subject
        FOR c IN
            SELECT * FROM public.reschedule_patientschedule(w.patient_schedule_id, w.req_date, p_user_id, true, true, true)
        LOOP
            INSERT INTO pg_temp.tmp_all_changed(patient_schedule_id) VALUES (c.patient_schedule_id)
            ON CONFLICT DO NOTHING;

            -- Analyze effects around each changed row c
            -- 1) Same vaccine next dose that violates min interval -> enqueue
            PERFORM 1;
            WITH meta AS (
                SELECT sd.min_interval_days AS n_min
                FROM schedule_doses sd
                JOIN schedule_master sm ON sm.id = sd.schedule_id
                WHERE sm.vaccine_id = c.vaccine_id AND sd.dose_number = c.dose_number + 1
                LIMIT 1
            ), nxt AS (
                SELECT ps.* FROM patientschedule ps
                WHERE ps.patient_id = c.patient_id AND ps.vaccine_id = c.vaccine_id AND ps.dose_number = c.dose_number + 1 AND COALESCE(ps.is_deleted,false) = false
            )
            INSERT INTO pg_temp.tmp_work_queue(patient_schedule_id, req_date)
            SELECT n.patient_schedule_id,
                   (c.scheduled_date + (COALESCE(m.n_min, 0) * INTERVAL '1 day'))::date
            FROM nxt n CROSS JOIN meta m
            WHERE n.actual_date IS NULL
              AND m.n_min IS NOT NULL
              AND n.scheduled_date < (c.scheduled_date + (m.n_min * INTERVAL '1 day'))::date
            ON CONFLICT (patient_schedule_id) DO UPDATE SET req_date = EXCLUDED.req_date;

            -- 2) Other-vaccine conflicts around c.scheduled_date -> enqueue peers
            WITH subj AS (
                SELECT sm.concurrent_allowed AS subj_conc, sd.due_after_days AS subj_dad
                FROM schedule_master sm
                JOIN schedule_doses sd ON sd.schedule_id = sm.id AND sd.dose_number = c.dose_number
                WHERE sm.vaccine_id = c.vaccine_id
                LIMIT 1
            ), conflicts AS (
                SELECT ps.patient_schedule_id, ps.vaccine_id,
                       COALESCE(ps.actual_date, ps.scheduled_date)::date AS odate,
                       sm2.concurrent_allowed AS other_conc,
                       sd2.min_interval_other_vax AS other_min_other,
                       sd2.due_after_days AS other_dad
                FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                JOIN schedule_doses sd2 ON sd2.schedule_id = sm2.id AND sd2.dose_number = ps.dose_number
                WHERE ps.patient_id = c.patient_id
                  AND ps.vaccine_id <> c.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.actual_date IS NULL
            ), viol AS (
                SELECT cf.*, (
                    SELECT subj_conc FROM subj
                ) AS subj_conc,
                (
                    SELECT subj_dad FROM subj
                ) AS subj_dad,
                ABS(cf.odate - c.scheduled_date) AS diff
                FROM conflicts cf
            )
            INSERT INTO pg_temp.tmp_work_queue(patient_schedule_id, req_date)
            SELECT v.patient_schedule_id,
                   CASE
                       WHEN v.other_min_other IS NULL THEN c.scheduled_date
                       WHEN v.diff = 0 AND v.subj_conc AND v.other_conc THEN c.scheduled_date
                       WHEN v.other_dad IS NOT NULL AND v.other_dad = v.subj_dad AND v.subj_conc AND v.other_conc THEN c.scheduled_date
                       ELSE (c.scheduled_date + (COALESCE(v.other_min_other,0) * INTERVAL '1 day'))::date
                   END AS req_date
            FROM viol v
            WHERE (
                v.other_min_other IS NOT NULL AND (
                    (v.diff = 0 AND NOT (v.subj_conc AND v.other_conc)) OR
                    (v.diff < v.other_min_other)
                )
            )
            ON CONFLICT (patient_schedule_id) DO UPDATE SET req_date = EXCLUDED.req_date;
        END LOOP; -- each changed row around this subject
    END LOOP; -- work queue

    -- Return all changed rows aggregated
    RETURN QUERY
    SELECT * FROM patientschedule ps WHERE ps.patient_schedule_id IN (SELECT patient_schedule_id FROM pg_temp.tmp_all_changed);
END;
$$;

-- 2) New RPC: reschedule with cascade and DAD-group handling
-- Clean up older overload to avoid ambiguity
DROP FUNCTION IF EXISTS public.reschedule_patientschedule(bigint, date, bigint);
DROP FUNCTION IF EXISTS public.reschedule_patientschedule(bigint, date, bigint, boolean, boolean);
CREATE OR REPLACE FUNCTION public.reschedule_patientschedule(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint DEFAULT NULL,
    p_do_cascade boolean DEFAULT true,
    p_do_group boolean DEFAULT true,
    p_keep_subject_date boolean DEFAULT true
)
RETURNS SETOF patientschedule
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    s RECORD;
    v_dob DATE;
    v_due_after INT;
    v_baseline_due DATE;
    v_min_same INT;
    v_max_same INT;
    v_min_other INT;
    v_concurrent BOOLEAN;
    v_req_prev BOOLEAN;
    v_skip BOOLEAN;
    v_prev_ref DATE;
    v_prev_ps_id bigint;
    v_prev_has_actual boolean := false;
    v_next_ps_id bigint;
    v_next_ref DATE;
    v_next_has_actual boolean := false;
    v_next_min INT;
    v_next_max INT;
    v_current_new DATE := p_new_date;
    v_initial_req DATE := p_new_date;
    v_iter INT := 0;
    v_changed_ids BIGINT[] := ARRAY[]::BIGINT[];
    v_tmp_id BIGINT;
    nxt RECORD;
    nxt_min INT;
    nxt_max INT;
    nxt_new DATE;
    v_has_trace boolean := false;
    v_reason text := '';
    v_old_date date;
    v_reason_search text := '';
BEGIN
    -- Lock the subject row and fetch metadata
    SELECT ps.* INTO s
    FROM patientschedule ps
    WHERE ps.patient_schedule_id = p_patient_schedule_id AND COALESCE(ps.is_deleted,false) = false
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'patientschedule % not found', p_patient_schedule_id;
    END IF;

    -- Detect if a debug trace temp table exists in this session
    SELECT to_regclass('pg_temp.tmp_reschedule_trace') IS NOT NULL INTO v_has_trace;

    SELECT p.date_of_birth INTO v_dob FROM patients p WHERE p.patient_id = s.patient_id;

    SELECT sd.due_after_days, sd.min_interval_days, sd.max_interval_days, sd.min_interval_other_vax,
           sm.concurrent_allowed, COALESCE(sd.requires_previous, (sd.max_interval_days IS NOT NULL)) AS requires_previous,
           COALESCE(sd.skippable,false) AS skippable
    INTO v_due_after, v_min_same, v_max_same, v_min_other, v_concurrent, v_req_prev, v_skip
    FROM schedule_doses sd
    JOIN schedule_master sm ON sm.id = sd.schedule_id
    WHERE sm.vaccine_id = s.vaccine_id AND sd.dose_number = s.dose_number
    LIMIT 1;

    IF v_dob IS NOT NULL AND v_due_after IS NOT NULL THEN
        v_baseline_due := (v_dob + (v_due_after * INTERVAL '1 day'))::date;
    END IF;

    -- Determine previous reference (actual first else scheduled)
    SELECT MAX(COALESCE(ps.actual_date, ps.scheduled_date)) INTO v_prev_ref
    FROM patientschedule ps
    WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number < s.dose_number AND COALESCE(ps.is_deleted,false) = false;

    -- Capture previous and next dose rows (if present) to detect completed doses
    SELECT ps.patient_schedule_id, COALESCE(ps.actual_date, ps.scheduled_date) AS ref_date, (ps.actual_date IS NOT NULL) AS has_actual
    INTO v_prev_ps_id, v_prev_ref, v_prev_has_actual
    FROM patientschedule ps
    WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number < s.dose_number AND COALESCE(ps.is_deleted,false) = false
    ORDER BY COALESCE(ps.actual_date, ps.scheduled_date) DESC
    LIMIT 1;

    SELECT ps.patient_schedule_id, COALESCE(ps.actual_date, ps.scheduled_date) AS ref_date, (ps.actual_date IS NOT NULL) AS has_actual
    INTO v_next_ps_id, v_next_ref, v_next_has_actual
    FROM patientschedule ps
    WHERE ps.patient_id = s.patient_id AND ps.vaccine_id = s.vaccine_id AND ps.dose_number > s.dose_number AND COALESCE(ps.is_deleted,false) = false
    ORDER BY COALESCE(ps.actual_date, ps.scheduled_date) ASC
    LIMIT 1;

    IF v_next_ps_id IS NOT NULL THEN
        SELECT sd.min_interval_days, sd.max_interval_days INTO v_next_min, v_next_max
        FROM schedule_doses sd
        JOIN schedule_master sm ON sm.id = sd.schedule_id
        WHERE sm.vaccine_id = s.vaccine_id AND sd.dose_number = s.dose_number + 1
        LIMIT 1;
    END IF;

    IF v_req_prev AND v_prev_ref IS NULL AND NOT v_skip THEN
        RAISE EXCEPTION 'Cannot reschedule: previous dose missing and required.';
    END IF;

    -- First, force within [min_same, max_same] from previous
    IF v_prev_ref IS NOT NULL THEN
        IF v_min_same IS NOT NULL AND v_current_new < (v_prev_ref + (v_min_same * INTERVAL '1 day'))::date THEN
            IF v_has_trace THEN
                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                VALUES ('subject-search', (v_prev_ref + (v_min_same * INTERVAL '1 day'))::date, 'min_interval_same', 'adjust', json_build_object('prev_ref', v_prev_ref, 'min_days', v_min_same, 'requested', v_initial_req));
            END IF;
            v_reason := trim(both ' ' from (v_reason || CASE WHEN v_reason <> '' THEN '; ' ELSE '' END || 'min_interval_same'));
            v_current_new := (v_prev_ref + (v_min_same * INTERVAL '1 day'))::date;
        END IF;
        IF v_max_same IS NOT NULL AND v_current_new > (v_prev_ref + (v_max_same * INTERVAL '1 day'))::date THEN
            IF v_has_trace THEN
                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                VALUES ('subject-search', (v_prev_ref + (v_max_same * INTERVAL '1 day'))::date, 'max_interval_same', 'adjust', json_build_object('prev_ref', v_prev_ref, 'max_days', v_max_same, 'requested', v_initial_req));
            END IF;
            v_reason := trim(both ' ' from (v_reason || CASE WHEN v_reason <> '' THEN '; ' ELSE '' END || 'max_interval_same'));
            v_current_new := (v_prev_ref + (v_max_same * INTERVAL '1 day'))::date;
        END IF;
    END IF;

    -- Subject must not be earlier than its baseline DAD (DOB + due_after_days) — hard stop
    IF v_baseline_due IS NOT NULL AND v_current_new < v_baseline_due THEN
        IF v_has_trace THEN
            INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
            VALUES ('subject-search', v_current_new, 'baseline_due_after_days', 'reject', json_build_object('baseline', v_baseline_due));
        END IF;
        RAISE EXCEPTION 'PS:% V:% D:% — Scheduled date (%) cannot be earlier than baseline due_after_days (%).', s.patient_schedule_id, s.vaccine_id, s.dose_number, v_current_new, v_baseline_due;
    END IF;

    -- Strict checks: block if the requested date would violate intervals relative to any recorded (actual_date) dose
    -- 1) DAD peers with actual_date that would be violated by v_current_new
    IF v_due_after IS NOT NULL THEN
        IF EXISTS (
            WITH subj AS (
                SELECT sm.concurrent_allowed AS subj_conc
                FROM schedule_master sm WHERE sm.vaccine_id = s.vaccine_id LIMIT 1
            )
            SELECT 1
            FROM patientschedule ps_gm
            JOIN schedule_master sm_gm ON sm_gm.vaccine_id = ps_gm.vaccine_id
            JOIN schedule_doses sd_gm ON sd_gm.schedule_id = sm_gm.id AND sd_gm.dose_number = ps_gm.dose_number
            CROSS JOIN subj
            WHERE ps_gm.patient_id = s.patient_id
              AND ps_gm.vaccine_id <> s.vaccine_id
              AND COALESCE(ps_gm.is_deleted,false) = false
              AND ps_gm.actual_date IS NOT NULL
              AND sd_gm.due_after_days = v_due_after
              AND sd_gm.min_interval_other_vax IS NOT NULL
              AND (
                    ABS(COALESCE(ps_gm.actual_date, ps_gm.scheduled_date)::date - v_current_new) < sd_gm.min_interval_other_vax
                    AND NOT (
                        COALESCE(ps_gm.actual_date, ps_gm.scheduled_date)::date = v_current_new
                        AND COALESCE(sm_gm.concurrent_allowed,false) AND COALESCE(subj.subj_conc,false)
                    )
              )
        ) THEN
            RAISE EXCEPTION 'DAD peer with a recorded date would be violated by requested date %; operation blocked.', v_current_new;
        END IF;
    END IF;

    -- 2) Same-vaccine previous/next completed doses
    IF v_prev_ref IS NOT NULL AND v_prev_has_actual THEN
        IF v_min_same IS NOT NULL AND v_current_new < (v_prev_ref + (v_min_same * INTERVAL '1 day'))::date THEN
            RAISE EXCEPTION 'Cannot schedule earlier than min_interval_days (%s days) from completed previous dose on %s.', v_min_same, v_prev_ref;
        END IF;
        IF v_max_same IS NOT NULL AND v_current_new > (v_prev_ref + (v_max_same * INTERVAL '1 day'))::date THEN
            RAISE EXCEPTION 'Cannot schedule beyond max_interval_days (%s days) from completed previous dose on %s.', v_max_same, v_prev_ref;
        END IF;
    END IF;
    IF v_next_ref IS NOT NULL AND v_next_has_actual THEN
        IF v_next_min IS NOT NULL AND v_current_new > (v_next_ref - (v_next_min * INTERVAL '1 day'))::date THEN
            RAISE EXCEPTION 'Requested date %s would be too close to completed subsequent dose on %s (min_interval_days %s).', v_current_new, v_next_ref, v_next_min;
        END IF;
        IF v_next_max IS NOT NULL AND v_current_new < (v_next_ref - (v_next_max * INTERVAL '1 day'))::date THEN
            RAISE EXCEPTION 'Requested date %s would be earlier than allowed relative to completed subsequent dose on %s (max_interval_days %s).', v_current_new, v_next_ref, v_next_max;
        END IF;
    END IF;

    -- 3) Cross-vax completed peers violating min_interval_other_vax
    IF v_min_other IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM patientschedule ps
            JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
            WHERE ps.patient_id = s.patient_id
              AND ps.vaccine_id <> s.vaccine_id
              AND COALESCE(ps.is_deleted,false) = false
              AND ps.actual_date IS NOT NULL
              AND (
                    ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - v_current_new) < v_min_other
                    AND NOT (
                        (COALESCE(ps.actual_date, ps.scheduled_date))::date = v_current_new
                        AND COALESCE((SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = s.vaccine_id LIMIT 1),false)
                        AND COALESCE(sm2.concurrent_allowed,false)
                    )
                  )
        ) THEN
            RAISE EXCEPTION 'Requested date %s would violate min_interval_other_vax relative to a recorded dose; operation blocked.', v_current_new;
        END IF;
    END IF;

    -- Find a date satisfying concurrency and cross-vax min spacing only if subject is allowed to move
    IF NOT p_keep_subject_date THEN
        <<find_valid_date>>
        WHILE v_iter < 60 LOOP  -- cap search within ~2 months window
            v_iter := v_iter + 1;
            -- Same vaccine: forbid same-day with any other dose in the series
            IF EXISTS (
                SELECT 1 FROM patientschedule ps
                WHERE ps.patient_id = s.patient_id
                  AND ps.vaccine_id = s.vaccine_id
                  AND ps.dose_number <> s.dose_number
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.scheduled_date = v_current_new
            ) THEN
                IF v_has_trace THEN
                    INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                    VALUES ('subject-search', v_current_new, 'same_vaccine_same_day', 'reject', json_build_object('vaccine_id', s.vaccine_id, 'dose_number', s.dose_number));
                END IF;
                v_reason_search := trim(both ' ' from (v_reason_search || CASE WHEN v_reason_search <> '' THEN '; ' ELSE '' END || 'same_vaccine_same_day'));
                v_current_new := v_current_new + INTERVAL '1 day';
                CONTINUE;
            END IF;
            -- Same-day concurrency check: if any other sched on that date conflicts
            IF EXISTS (
                SELECT 1
                FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                WHERE ps.patient_id = s.patient_id
                  AND ps.vaccine_id <> s.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.scheduled_date = v_current_new
                  AND NOT (COALESCE(v_concurrent,false) AND COALESCE(sm2.concurrent_allowed,false))
            ) THEN
                IF v_has_trace THEN
                    INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                    VALUES ('subject-search', v_current_new, 'same_day_concurrency', 'reject', json_build_object('subject_concurrent', v_concurrent));
                END IF;
                v_reason_search := trim(both ' ' from (v_reason_search || CASE WHEN v_reason_search <> '' THEN '; ' ELSE '' END || 'same_day_concurrency'));
                v_current_new := v_current_new + INTERVAL '1 day';
                CONTINUE;
            END IF;

            -- Cross-vax min spacing check to nearest other date; allow same-day if both concurrent
            IF v_min_other IS NOT NULL THEN
                IF EXISTS (
                    SELECT 1
                    FROM patientschedule ps
                    JOIN schedule_doses od ON od.schedule_id IN (SELECT id FROM schedule_master WHERE vaccine_id = ps.vaccine_id)
                    JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                    WHERE ps.patient_id = s.patient_id
                      AND ps.vaccine_id <> s.vaccine_id
                      AND COALESCE(ps.is_deleted,false) = false
                      AND ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - v_current_new) < v_min_other
                      AND NOT (
                          (COALESCE(ps.actual_date, ps.scheduled_date))::date = v_current_new
                          AND COALESCE(v_concurrent,false) AND COALESCE(sm2.concurrent_allowed,false)
                      )
                ) THEN
                    IF v_has_trace THEN
                        INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                        VALUES ('subject-search', v_current_new, 'min_interval_other_vax', 'reject', json_build_object('min_other', v_min_other));
                    END IF;
                    v_reason_search := trim(both ' ' from (v_reason_search || CASE WHEN v_reason_search <> '' THEN '; ' ELSE '' END || 'min_interval_other_vax'));
                    v_current_new := v_current_new + INTERVAL '1 day';
                    CONTINUE;
                END IF;
            END IF;

            IF v_has_trace THEN
                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                VALUES ('subject-search', v_current_new, 'all_constraints', 'accept', json_build_object());
            END IF;
            EXIT; -- valid
        END LOOP;
    END IF;

    -- Update the subject schedule FIRST so the primary row reflects the change
    IF s.actual_date IS NULL AND s.scheduled_date IS DISTINCT FROM v_current_new THEN
        BEGIN
            v_old_date := s.scheduled_date;
            UPDATE patientschedule
            SET scheduled_date = v_current_new,
                status = 'Rescheduled',
                updated_by = p_user_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE patient_schedule_id = s.patient_schedule_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'While updating subject PS:% V:% D:% to %, DB rejected: %', s.patient_schedule_id, s.vaccine_id, s.dose_number, v_current_new, SQLERRM;
        END;
        v_changed_ids := v_changed_ids || s.patient_schedule_id;
        IF v_has_trace THEN
            INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
            VALUES ('subject-update', v_current_new, 'update_subject', 'apply', json_build_object('patient_schedule_id', s.patient_schedule_id));
        END IF;
        -- Detailed activity log with before/after and reason
        BEGIN
            INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
            VALUES (
                'SCHEDULE_UPDATE',
                p_user_id,
                'patientschedule',
                s.patient_schedule_id,
                format('Subject update: %s -> %s (reasons: %s%s)',
                       v_old_date,
                       v_current_new,
                       COALESCE(NULLIF(v_reason,''),'requested'),
                       CASE WHEN v_reason_search <> '' THEN CASE WHEN v_reason <> '' THEN '; ' ELSE '' END || v_reason_search ELSE '' END
                ),
                CURRENT_TIMESTAMP
            );
        EXCEPTION WHEN OTHERS THEN
            -- ignore logging errors
        END;
    END IF;

    -- Now, Group move: reschedule other vaccines that originally share the same DueAfterDays (DAD) only when necessary (peer would violate its own min_interval_other_vax)
    v_tmp_id := s.patient_schedule_id;
    IF p_do_group AND v_due_after IS NOT NULL THEN
        FOR nxt IN
            SELECT ps_gm.*, sd_gm.min_interval_days AS gm_min, sd_gm.max_interval_days AS gm_max,
                   sd_gm.min_interval_other_vax AS gm_min_other, sd_gm.due_after_days AS gm_dad,
                   sm_gm.concurrent_allowed AS gm_concurrent
            FROM patientschedule ps_gm
            JOIN schedule_doses sd_gm ON sd_gm.schedule_id IN (SELECT id FROM schedule_master WHERE vaccine_id = ps_gm.vaccine_id)
            JOIN schedule_master sm_gm ON sm_gm.vaccine_id = ps_gm.vaccine_id
            WHERE ps_gm.patient_id = s.patient_id
              AND ps_gm.vaccine_id <> s.vaccine_id
              AND COALESCE(ps_gm.is_deleted,false) = false
              AND ps_gm.actual_date IS NULL
              AND sd_gm.dose_number = ps_gm.dose_number
              AND sd_gm.due_after_days = v_due_after
        LOOP
            -- Both must allow concurrency to share the same date
            IF NOT (COALESCE(v_concurrent,false) AND COALESCE(nxt.gm_concurrent,false)) THEN
                CONTINUE;
            END IF;
            -- Only align peer if leaving it unmoved would violate its own min_interval_other_vax relative to the subject's date
            IF nxt.gm_min_other IS NULL THEN
                CONTINUE; -- no cross-vax min configured: do not force alignment
            END IF;
            IF ABS(COALESCE(nxt.actual_date, nxt.scheduled_date)::date - v_current_new) >= nxt.gm_min_other THEN
                CONTINUE; -- safe spacing: no need to move
            END IF;
            -- Same-vax prev constraint for the group member
            SELECT MAX(COALESCE(ps2.actual_date, ps2.scheduled_date))
            INTO v_prev_ref
            FROM patientschedule ps2
            WHERE ps2.patient_id = nxt.patient_id AND ps2.vaccine_id = nxt.vaccine_id AND ps2.dose_number < nxt.dose_number AND COALESCE(ps2.is_deleted,false) = false;

            IF v_prev_ref IS NOT NULL THEN
                IF nxt.gm_min IS NOT NULL AND v_current_new < (v_prev_ref + (nxt.gm_min * INTERVAL '1 day'))::date THEN
                    CONTINUE; -- cannot align on this date
                END IF;
                IF nxt.gm_max IS NOT NULL AND v_current_new > (v_prev_ref + (nxt.gm_max * INTERVAL '1 day'))::date THEN
                    CONTINUE; -- would violate max
                END IF;
            END IF;
            -- Guard: do not move peer earlier than its own DAD baseline
            IF v_dob IS NOT NULL AND nxt.gm_dad IS NOT NULL THEN
                IF v_current_new < (v_dob + (nxt.gm_dad * INTERVAL '1 day'))::date THEN
                    CONTINUE;
                END IF;
            END IF;

            -- Update group member to align on v_current_new (skip no-op)
            IF nxt.actual_date IS NULL AND nxt.scheduled_date IS DISTINCT FROM v_current_new THEN
                v_old_date := nxt.scheduled_date;
                UPDATE patientschedule
                SET scheduled_date = v_current_new,
                    status = 'Rescheduled',
                    updated_by = p_user_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE patient_schedule_id = nxt.patient_schedule_id;
                v_changed_ids := v_changed_ids || nxt.patient_schedule_id;
                IF v_has_trace THEN
                    INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                    VALUES ('group-move', v_current_new, 'dad_align', 'apply', json_build_object('peer_schedule_id', nxt.patient_schedule_id));
                END IF;
                -- Detailed activity log with before/after and reason
                BEGIN
                    INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
                    VALUES (
                        'SCHEDULE_UPDATE',
                        p_user_id,
                        'patientschedule',
                        nxt.patient_schedule_id,
                        format('Group move (DAD peer): %s -> %s (reason: miov relative to subject %s)',
                               v_old_date,
                               v_current_new,
                               v_current_new
                        ),
                        CURRENT_TIMESTAMP
                    );
                EXCEPTION WHEN OTHERS THEN
                    -- ignore logging errors
                END;
            END IF;
        END LOOP;
    END IF;

        -- Cascade forward for the same vaccine series
        IF p_do_cascade THEN
        LOOP
                SELECT ps.*,
                             sd.min_interval_days AS n_min,
                             sd.max_interval_days AS n_max,
                             sd.due_after_days   AS n_dad
                INTO nxt
                FROM patientschedule ps
                JOIN schedule_master sm ON sm.vaccine_id = ps.vaccine_id
                JOIN schedule_doses sd ON sd.schedule_id = sm.id AND sd.dose_number = ps.dose_number
                WHERE ps.patient_id = s.patient_id
                    AND ps.vaccine_id = s.vaccine_id
                    AND ps.dose_number = (
                                SELECT MIN(dose_number) FROM patientschedule
                                WHERE patient_id = s.patient_id AND vaccine_id = s.vaccine_id AND dose_number > COALESCE((SELECT dose_number FROM patientschedule WHERE patient_schedule_id = v_tmp_id), s.dose_number)
                                AND COALESCE(is_deleted,false) = false
                    )
                    AND COALESCE(ps.is_deleted,false) = false
                ORDER BY ps.dose_number
                LIMIT 1;

        EXIT WHEN NOT FOUND;

        nxt_min := nxt.n_min;
        nxt_max := nxt.n_max;
        -- Compute candidate new date for next
        nxt_new := (v_current_new + (COALESCE(nxt_min, 0) * INTERVAL '1 day'))::date;
        -- Respect next dose baseline (DOB + due_after_days) so we never schedule earlier than DAD
        IF v_dob IS NOT NULL AND nxt.n_dad IS NOT NULL THEN
            IF nxt_new < (v_dob + (nxt.n_dad * INTERVAL '1 day'))::date THEN
                IF v_has_trace THEN
                    INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                    VALUES ('cascade-search', nxt_new, 'baseline_due_after_days', 'adjust', json_build_object('baseline', (v_dob + (nxt.n_dad * INTERVAL '1 day'))::date, 'next_schedule_id', nxt.patient_schedule_id));
                END IF;
                nxt_new := (v_dob + (nxt.n_dad * INTERVAL '1 day'))::date;
            END IF;
        END IF;
        -- Respect next's max if defined
        IF nxt_max IS NOT NULL THEN
            IF nxt_new > (v_current_new + (nxt_max * INTERVAL '1 day'))::date THEN
                nxt_new := (v_current_new + (nxt_max * INTERVAL '1 day'))::date;
            END IF;
        END IF;

        -- Adjust next for cross-vax and concurrency as well
        v_iter := 0;
        WHILE v_iter < 60 LOOP
            v_iter := v_iter + 1;
            -- Same-day concurrency check for next
            IF EXISTS (
                SELECT 1 FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                WHERE ps.patient_id = nxt.patient_id
                  AND ps.vaccine_id <> nxt.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.scheduled_date = nxt_new
                  AND NOT (
                      (SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = nxt.vaccine_id) AND COALESCE(sm2.concurrent_allowed,false)
                  )
            ) THEN
                IF v_has_trace THEN
                    INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                    VALUES ('cascade-search', nxt_new, 'same_day_concurrency', 'reject', json_build_object('next_schedule_id', nxt.patient_schedule_id));
                END IF;
                nxt_new := nxt_new + INTERVAL '1 day';
                CONTINUE;
            END IF;
            -- Cross-vax min spacing for next (use its own min_interval_other_vax)
            IF EXISTS (
                SELECT 1
                FROM patientschedule ps
                JOIN schedule_doses od ON od.schedule_id IN (SELECT id FROM schedule_master WHERE vaccine_id = ps.vaccine_id)
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                WHERE ps.patient_id = nxt.patient_id
                  AND ps.vaccine_id <> nxt.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ABS((COALESCE(ps.actual_date, ps.scheduled_date))::date - nxt_new) < COALESCE((SELECT min_interval_other_vax FROM schedule_doses sd2 JOIN schedule_master sm3 ON sm3.id = sd2.schedule_id WHERE sm3.vaccine_id = nxt.vaccine_id AND sd2.dose_number = nxt.dose_number LIMIT 1), 0)
                  AND NOT ((COALESCE(ps.actual_date, ps.scheduled_date))::date = nxt_new
                           AND COALESCE((SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = nxt.vaccine_id),false)
                           AND COALESCE(sm2.concurrent_allowed,false))
            ) THEN
                IF v_has_trace THEN
                    INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                    VALUES ('cascade-search', nxt_new, 'min_interval_other_vax', 'reject', json_build_object('next_schedule_id', nxt.patient_schedule_id));
                END IF;
                nxt_new := nxt_new + INTERVAL '1 day';
                CONTINUE;
            END IF;
            EXIT;
        END LOOP;

        -- Update next if date changed and not completed
        IF nxt.actual_date IS NULL AND nxt.scheduled_date IS DISTINCT FROM nxt_new THEN
            BEGIN
                v_old_date := nxt.scheduled_date;
                UPDATE patientschedule
                SET scheduled_date = nxt_new,
                    status = 'Rescheduled',
                    updated_by = p_user_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE patient_schedule_id = nxt.patient_schedule_id
                RETURNING patient_schedule_id INTO v_tmp_id;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Cascade update failed. Subject PS:% V:% D:%; Next PS:% V:% D:% to % — DB error: %', s.patient_schedule_id, s.vaccine_id, s.dose_number, nxt.patient_schedule_id, nxt.vaccine_id, nxt.dose_number, nxt_new, SQLERRM;
            END;
            v_changed_ids := v_changed_ids || nxt.patient_schedule_id;
            IF v_has_trace THEN
                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                VALUES ('cascade-update', nxt_new, 'update_next', 'apply', json_build_object('patient_schedule_id', nxt.patient_schedule_id));
            END IF;
            -- Detailed activity log with before/after and reason
            BEGIN
                INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
                VALUES (
                    'SCHEDULE_UPDATE',
                    p_user_id,
                    'patientschedule',
                    nxt.patient_schedule_id,
                    format('Cascade next: %s -> %s (reasons: min_interval_same%s)',
                           v_old_date,
                           nxt_new,
                           CASE
                             WHEN EXISTS (
                                SELECT 1
                                FROM schedule_doses sd2 JOIN schedule_master sm2 ON sm2.id = sd2.schedule_id
                                WHERE sm2.vaccine_id = nxt.vaccine_id AND sd2.dose_number = nxt.dose_number AND sd2.due_after_days IS NOT NULL
                             ) THEN '; baseline'
                             ELSE ''
                           END
                    ),
                    CURRENT_TIMESTAMP
                );
            EXCEPTION WHEN OTHERS THEN
                -- ignore logging errors
            END;

            -- Group move for next's DAD peers only if keeping them unmoved would violate their min_interval_other_vax (exception: if safe, don't move)
            PERFORM 1; -- placeholder
            IF p_do_group AND EXISTS (
                SELECT 1 FROM schedule_doses sd3
                JOIN schedule_master sm3 ON sm3.id = sd3.schedule_id
                WHERE sm3.vaccine_id = nxt.vaccine_id AND sd3.dose_number = nxt.dose_number AND sd3.due_after_days IS NOT NULL
            ) THEN
                FOR s IN
                    SELECT ps_g2.*, sd2.due_after_days AS g2_dad,
                           sd2.min_interval_days AS g2_min, sd2.max_interval_days AS g2_max,
                           sd2.min_interval_other_vax AS g2_min_other,
                           sm2.concurrent_allowed AS g2_conc
                    FROM patientschedule ps_g2
                    JOIN schedule_master sm2 ON sm2.vaccine_id = ps_g2.vaccine_id
                    JOIN schedule_doses sd2 ON sd2.schedule_id = sm2.id AND sd2.dose_number = ps_g2.dose_number
                    WHERE ps_g2.patient_id = nxt.patient_id
                      AND ps_g2.vaccine_id <> nxt.vaccine_id
                      AND COALESCE(ps_g2.is_deleted,false) = false
                      AND ps_g2.actual_date IS NULL
                      AND sd2.due_after_days = (
                        SELECT sd4.due_after_days FROM schedule_doses sd4 JOIN schedule_master sm4 ON sm4.id = sd4.schedule_id
                        WHERE sm4.vaccine_id = nxt.vaccine_id AND sd4.dose_number = nxt.dose_number LIMIT 1
                      )
                LOOP
                    -- only align if both concurrent
                    IF NOT (COALESCE((SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = nxt.vaccine_id),false) AND COALESCE(s.g2_conc,false)) THEN
                        CONTINUE;
                    END IF;
                    -- If leaving peer at its current date would be < its min_interval_other_vax from nxt_new, we must move it; else skip
                    IF s.g2_min_other IS NOT NULL THEN
                        IF ABS(s.scheduled_date - nxt_new) >= s.g2_min_other THEN
                            CONTINUE; -- exception: safe spacing, do not move peer
                        END IF;
                    END IF;
                    -- Do not move peer earlier than its own baseline DAD
                    IF v_dob IS NOT NULL AND s.g2_dad IS NOT NULL THEN
                        IF nxt_new < (v_dob + (s.g2_dad * INTERVAL '1 day'))::date THEN
                            IF v_has_trace THEN
                                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                                VALUES ('group-move', nxt_new, 'baseline_due_after_days', 'skip', json_build_object('peer_schedule_id', s.patient_schedule_id, 'baseline', (v_dob + (s.g2_dad * INTERVAL '1 day'))::date));
                            END IF;
                            CONTINUE;
                        END IF;
                    END IF;
                    -- check this group's own same-vax previous
                    SELECT MAX(COALESCE(ps3.actual_date, ps3.scheduled_date)) INTO v_prev_ref
                    FROM patientschedule ps3
                    WHERE ps3.patient_id = s.patient_id AND ps3.vaccine_id = s.vaccine_id AND ps3.dose_number < s.dose_number AND COALESCE(ps3.is_deleted,false) = false;
                    IF v_prev_ref IS NOT NULL THEN
                        IF s.g2_min IS NOT NULL AND nxt_new < (v_prev_ref + (s.g2_min * INTERVAL '1 day'))::date THEN CONTINUE; END IF;
                        IF s.g2_max IS NOT NULL AND nxt_new > (v_prev_ref + (s.g2_max * INTERVAL '1 day'))::date THEN CONTINUE; END IF;
                    END IF;
                    BEGIN
                        IF s.actual_date IS NULL AND s.scheduled_date IS DISTINCT FROM nxt_new THEN
                            v_old_date := s.scheduled_date;
                            UPDATE patientschedule
                            SET scheduled_date = nxt_new,
                                status = 'Rescheduled',
                                updated_by = p_user_id,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE patient_schedule_id = s.patient_schedule_id;
                            v_changed_ids := v_changed_ids || s.patient_schedule_id;
                            IF v_has_trace THEN
                                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                                VALUES ('group-move', nxt_new, 'dad_peer_align', 'apply', json_build_object('peer_schedule_id', s.patient_schedule_id));
                            END IF;
                            -- Detailed activity log with before/after and reason for DAD peer in cascade
                            BEGIN
                                INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
                                VALUES (
                                    'SCHEDULE_UPDATE',
                                    p_user_id,
                                    'patientschedule',
                                    s.patient_schedule_id,
                                    format('Group move (DAD peer via cascade): %s -> %s (reason: miov relative to next %s)',
                                           v_old_date,
                                           nxt_new,
                                           nxt_new
                                    ),
                                    CURRENT_TIMESTAMP
                                );
                            EXCEPTION WHEN OTHERS THEN
                                -- ignore logging errors
                            END;
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        -- Optional peers: skip on error but record the reason in trace
                        IF v_has_trace THEN
                            INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                            VALUES ('group-move', nxt_new, 'peer_update_failed', 'skip', json_build_object('peer_schedule_id', s.patient_schedule_id, 'error', SQLERRM));
                        END IF;
                        CONTINUE;
                    END;
                END LOOP;
            END IF;
            -- continue cascading forward (v_tmp_id updated to the just-moved id)
        ELSE
            EXIT; -- either unchanged or already completed
        END IF;
    END LOOP;
    END IF;

    -- Subject already updated above

    -- Write summary activity logs for all changed schedules (if any)
    IF array_length(v_changed_ids, 1) IS NOT NULL THEN
        INSERT INTO activitylogs(action_type, user_id, entity_type, entity_id, description, timestamp)
        SELECT 'SCHEDULE_UPDATE_SUMMARY', p_user_id, 'patientschedule', ps.patient_schedule_id,
               'Rescheduled via RPC (cascade/group rules applied)', CURRENT_TIMESTAMP
        FROM (
            SELECT DISTINCT UNNEST(v_changed_ids) AS patient_schedule_id
        ) ids
        JOIN patientschedule ps ON ps.patient_schedule_id = ids.patient_schedule_id;
    END IF;

    -- Return affected rows (including the main one)
    RETURN QUERY
    SELECT * FROM patientschedule WHERE patient_schedule_id = ANY(v_changed_ids);
END;
$$;

-- Backward-compatible 5-arg wrapper to avoid ambiguous resolution in callers still using 5 parameters
CREATE OR REPLACE FUNCTION public.reschedule_patientschedule(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint,
    p_do_cascade boolean,
    p_do_group boolean
)
RETURNS SETOF patientschedule
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.reschedule_patientschedule(p_patient_schedule_id, p_new_date, p_user_id, p_do_cascade, p_do_group, true);
END;
$$;
