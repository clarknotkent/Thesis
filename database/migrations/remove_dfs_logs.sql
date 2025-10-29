-- ============================================================================
-- SQL Query to Remove and Disable DFS_ENQUEUE and DFS_VISIT Logging
-- ============================================================================
-- This script performs the following operations:
-- 1. Deletes all existing DFS_ENQUEUE and DFS_VISIT activity log entries
-- 2. Comments out/removes the INSERT statements in reschedule functions
-- 3. Updates column statistics to remove these action types
--
-- Created: October 29, 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Delete all existing DFS_ENQUEUE and DFS_VISIT activity logs
-- ============================================================================

DELETE FROM activitylogs 
WHERE action_type IN ('DFS_ENQUEUE', 'DFS_VISIT');

-- Verify deletion
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM activitylogs WHERE action_type IN ('DFS_ENQUEUE', 'DFS_VISIT');
    RAISE NOTICE 'Remaining DFS logs after deletion: %', v_count;
    
    IF v_count > 0 THEN
        RAISE WARNING 'Still found % DFS log entries after deletion attempt', v_count;
    ELSE
        RAISE NOTICE 'Successfully deleted all DFS_ENQUEUE and DFS_VISIT logs';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Recreate reschedule_patientschedule_dfs function WITHOUT DFS logging
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reschedule_patientschedule_dfs(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint DEFAULT NULL::bigint,
    p_max_depth integer DEFAULT 5
)
RETURNS TABLE (patient_schedule_id bigint, scheduled_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_depth int := 0;
    cur RECORD;
    c RECORD;
    s RECORD;
    v_has_trace boolean := false;
BEGIN
    -- temp structures: stack (LIFO), visited, changed
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_stack (
        id bigserial primary key,
        patient_schedule_id bigint,
        req_date date
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_visited (
        patient_schedule_id bigint primary key
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_changed (
        patient_schedule_id bigint primary key
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

        -- skip if visited
        IF EXISTS (SELECT 1 FROM pg_temp.tmp_dfs_visited WHERE patient_schedule_id = cur.patient_schedule_id) THEN
            CONTINUE;
        END IF;
        INSERT INTO pg_temp.tmp_dfs_visited(patient_schedule_id) VALUES (cur.patient_schedule_id) ON CONFLICT DO NOTHING;

        -- apply core reschedule for this node (subject-first update and group move)
        FOR c IN
            SELECT * FROM reschedule_patientschedule(cur.patient_schedule_id, cur.req_date, p_user_id, false, true)
        LOOP
        INSERT INTO pg_temp.tmp_dfs_changed(patient_schedule_id) VALUES (c.patient_schedule_id)
            ON CONFLICT DO NOTHING;
        -- DFS_VISIT logging REMOVED
            IF v_has_trace THEN
                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                VALUES ('dfs-visit', c.scheduled_date, 'apply_node', 'update', json_build_object('patient_schedule_id', c.patient_schedule_id));
            END IF;

            -- neighbors (DFS order): DAD peers -> next dose -> cross-vax conflicts
            -- DAD peers: align to current date
            WITH subj AS (
                SELECT sd.due_after_days AS dad, sm.concurrent_allowed AS subj_conc
                FROM schedule_doses sd JOIN schedule_master sm ON sm.id = sd.schedule_id
                WHERE sm.vaccine_id = c.vaccine_id AND sd.dose_number = c.dose_number
                LIMIT 1
            ), peers AS (
                SELECT ps.patient_schedule_id,
                       (SELECT date_of_birth FROM patients WHERE patient_id = ps.patient_id) AS dob,
                       sd2.due_after_days AS dad
                FROM patientschedule ps
                JOIN schedule_doses sd2 ON sd2.schedule_id IN (SELECT id FROM schedule_master WHERE vaccine_id = ps.vaccine_id)
                WHERE ps.patient_id = c.patient_id
                  AND ps.vaccine_id <> c.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.actual_date IS NULL
                  AND sd2.dose_number = ps.dose_number
                  AND sd2.due_after_days = (SELECT dad FROM subj)
            )
            INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
            SELECT peer1.patient_schedule_id,
                   GREATEST(
                       c.scheduled_date,
                       COALESCE((peer1.dob + (peer1.dad * INTERVAL '1 day'))::date, c.scheduled_date)
                   )
            FROM peers peer1
            ON CONFLICT DO NOTHING;
            -- DFS_ENQUEUE logging REMOVED (DAD peers)

            -- Next dose of same vaccine: min interval forward
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
            ON CONFLICT DO NOTHING;
            -- DFS_ENQUEUE logging REMOVED (next dose)

            -- Cross-vax conflicts by spacing rules
            WITH others AS (
                SELECT ps.patient_schedule_id,
                       COALESCE(ps.actual_date, ps.scheduled_date)::date AS eff_date,
                       sd.min_interval_other_vax,
                       sm2.concurrent_allowed AS other_conc
                FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                JOIN schedule_doses sd ON sd.schedule_id = sm2.id AND sd.dose_number = ps.dose_number
                WHERE ps.patient_id = c.patient_id
                  AND ps.vaccine_id <> c.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.actual_date IS NULL
            ), subj_conc AS (
                SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = c.vaccine_id LIMIT 1
            )
            INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
            SELECT o.patient_schedule_id,
                   CASE WHEN (c.scheduled_date > o.eff_date) THEN
                       o.eff_date
                   ELSE
                       (c.scheduled_date + (GREATEST(COALESCE(o.min_interval_other_vax, 0), 0) * INTERVAL '1 day'))::date
                   END
            FROM others o CROSS JOIN subj_conc sc
            WHERE o.min_interval_other_vax IS NOT NULL
              AND ABS(o.eff_date - c.scheduled_date) < o.min_interval_other_vax
              AND NOT (ABS(o.eff_date - c.scheduled_date) = 0 AND COALESCE(o.other_conc,false) AND COALESCE(sc.concurrent_allowed,false))
            ON CONFLICT DO NOTHING;
            -- DFS_ENQUEUE logging REMOVED (cross-vax conflicts)

        END LOOP;
    END LOOP;

    RETURN QUERY SELECT c.patient_schedule_id, c.scheduled_date FROM pg_temp.tmp_dfs_changed c;
END;
$function$;

-- ============================================================================
-- STEP 3: Recreate reschedule_patientschedule_dfs_v2 function WITHOUT DFS logging
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reschedule_patientschedule_dfs_v2(
    p_patient_schedule_id bigint,
    p_new_date date,
    p_user_id bigint DEFAULT NULL::bigint,
    p_max_depth integer DEFAULT 5,
    p_mode text DEFAULT 'full'::text
)
RETURNS TABLE(patient_schedule_id bigint, scheduled_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_depth int := 0;
    cur RECORD;
    c RECORD;
    v_has_trace boolean := false;
BEGIN
    -- temp structures: stack, processed, changed
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_stack (
        id bigserial primary key,
        patient_schedule_id bigint,
        req_date date
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_processed (
        patient_schedule_id bigint,
        req_date date,
        primary key(patient_schedule_id, req_date)
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_changed (
        patient_schedule_id bigint primary key
    ) ON COMMIT DROP;
    CREATE TEMP TABLE IF NOT EXISTS pg_temp.tmp_dfs_logged_enqueue (
        patient_schedule_id bigint,
        anchor_date date,
        kind text,
        logged boolean default false,
        primary key(patient_schedule_id, anchor_date, kind)
    ) ON COMMIT DROP;

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

    INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
    VALUES (p_patient_schedule_id, p_new_date);

    WHILE (SELECT COUNT(*) FROM pg_temp.tmp_dfs_stack) > 0 AND v_depth < p_max_depth LOOP
        v_depth := v_depth + 1;
        SELECT patient_schedule_id, req_date INTO cur
        FROM pg_temp.tmp_dfs_stack
        ORDER BY id DESC
        LIMIT 1;
        DELETE FROM pg_temp.tmp_dfs_stack WHERE id = (SELECT MAX(id) FROM pg_temp.tmp_dfs_stack);

        IF EXISTS (
            SELECT 1 FROM pg_temp.tmp_dfs_processed
            WHERE patient_schedule_id = cur.patient_schedule_id AND req_date = cur.req_date
        ) THEN
            CONTINUE;
        END IF;
        INSERT INTO pg_temp.tmp_dfs_processed(patient_schedule_id, req_date)
        VALUES (cur.patient_schedule_id, cur.req_date)
        ON CONFLICT DO NOTHING;

        FOR c IN
            SELECT * FROM public.reschedule_patientschedule(cur.patient_schedule_id, cur.req_date, p_user_id, false, true, true)
        LOOP
        INSERT INTO pg_temp.tmp_dfs_changed(patient_schedule_id) VALUES (c.patient_schedule_id)
            ON CONFLICT DO NOTHING;
        -- DFS_VISIT logging REMOVED
            IF v_has_trace THEN
                INSERT INTO pg_temp.tmp_reschedule_trace(phase, candidate_date, rule, decision, context)
                VALUES ('dfs-visit', c.scheduled_date, 'apply_node', 'update', json_build_object('patient_schedule_id', c.patient_schedule_id));
            END IF;

            -- DAD peers
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
            -- DFS_ENQUEUE logging REMOVED (DAD peers)
            
            -- Next dose (full mode)
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
                ON CONFLICT DO NOTHING;
                -- DFS_ENQUEUE logging REMOVED (next dose full)
            END IF;

            -- Cross-vax conflicts
            WITH others AS (
                SELECT ps.patient_schedule_id,
                       COALESCE(ps.actual_date, ps.scheduled_date)::date AS eff_date,
                       sd.min_interval_other_vax,
                       sm2.concurrent_allowed AS other_conc
                FROM patientschedule ps
                JOIN schedule_master sm2 ON sm2.vaccine_id = ps.vaccine_id
                JOIN schedule_doses sd ON sd.schedule_id = sm2.id AND sd.dose_number = ps.dose_number
                WHERE ps.patient_id = c.patient_id
                  AND ps.vaccine_id <> c.vaccine_id
                  AND COALESCE(ps.is_deleted,false) = false
                  AND ps.actual_date IS NULL
            ), subj_conc AS (
                SELECT concurrent_allowed FROM schedule_master WHERE vaccine_id = c.vaccine_id LIMIT 1
            )
            INSERT INTO pg_temp.tmp_dfs_stack(patient_schedule_id, req_date)
            SELECT o.patient_schedule_id,
                   CASE WHEN (c.scheduled_date > o.eff_date) THEN
                       o.eff_date
                   ELSE
                       (c.scheduled_date + (GREATEST(COALESCE(o.min_interval_other_vax, 0), 0) * INTERVAL '1 day'))::date
                   END
            FROM others o CROSS JOIN subj_conc sc
            WHERE o.min_interval_other_vax IS NOT NULL
              AND ABS(o.eff_date - c.scheduled_date) < o.min_interval_other_vax
              AND NOT (ABS(o.eff_date - c.scheduled_date) = 0 AND COALESCE(o.other_conc,false) AND COALESCE(sc.concurrent_allowed,false))
            ON CONFLICT DO NOTHING;
            -- DFS_ENQUEUE logging REMOVED (cross-vax)

        END LOOP;
    END LOOP;

    RETURN QUERY SELECT c.patient_schedule_id, c.scheduled_date FROM pg_temp.tmp_dfs_changed c;
END;
$function$;

-- ============================================================================
-- STEP 4: Update column statistics (if needed)
-- ============================================================================
-- Note: This will be automatically recalculated by PostgreSQL's autovacuum
-- but we can trigger an immediate update if desired

ANALYZE activitylogs;

-- ============================================================================
-- STEP 5: Final verification
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
    v_distinct_types INTEGER;
BEGIN
    -- Check remaining DFS logs
    SELECT COUNT(*) INTO v_count FROM activitylogs WHERE action_type IN ('DFS_ENQUEUE', 'DFS_VISIT');
    RAISE NOTICE 'Final count of DFS logs: %', v_count;
    
    -- Check distinct action types
    SELECT COUNT(DISTINCT action_type) INTO v_distinct_types FROM activitylogs;
    RAISE NOTICE 'Total distinct action types in activitylogs: %', v_distinct_types;
    
    -- List all remaining action types
    RAISE NOTICE 'Remaining action types: %', (
        SELECT string_agg(DISTINCT action_type, ', ' ORDER BY action_type) 
        FROM activitylogs
    );
END $$;

COMMIT;

-- ============================================================================
-- Summary of changes:
-- ============================================================================
-- ✓ Deleted all DFS_ENQUEUE and DFS_VISIT log entries from activitylogs table
-- ✓ Recreated reschedule_patientschedule_dfs() without DFS logging
-- ✓ Recreated reschedule_patientschedule_dfs_v2() without DFS logging
-- ✓ Updated table statistics
-- ✓ Verified cleanup
-- ============================================================================
