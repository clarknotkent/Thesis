# System & Task Activity Logging

System-level and background task events are logged via `utils/systemLogger.js` which wraps the unified activity logging mechanism.

## Helpers
- `logSystemStart(meta)` -> `SYSTEM_START`
- `logSystemShutdown(meta)` -> `SYSTEM_SHUTDOWN`
- `logTaskRun(name, meta)` -> `TASK_RUN`
- `logTaskSuccess(name, meta)` -> `TASK_SUCCESS`
- `logTaskFailure(name, error, meta)` -> `TASK_FAILURE`

## Guidelines
1. Use `TASK_RUN` immediately before beginning a scheduled/background job.
2. On successful completion, emit `TASK_SUCCESS` including summary stats in `meta` (e.g. processed counts).
3. On failure, emit `TASK_FAILURE` with the error message (added under `new_value.error`).
4. Emit `SYSTEM_START` once during server bootstrap (e.g. in `server.js`) and `SYSTEM_SHUTDOWN` inside a process signal handler (SIGINT/SIGTERM).
5. Do not include secrets (API keys, tokens) in meta payloads; sanitize before logging.

## Action Types
All constants live in `constants/activityTypes.js` and are seeded via migration `20250921_seed_new_activity_action_types.sql`. Apply migrations before relying on new action types to avoid trigger rejections.
