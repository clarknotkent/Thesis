-- Create a lightweight per-user session activity table to support sliding inactivity expiry
-- If the table already exists, this is a no-op.

create table if not exists public.user_sessions (
  user_id bigint primary key references public.users(user_id) on delete cascade,
  last_activity timestamptz not null default now()
);

-- Helpful index for admin reporting (optional)
create index if not exists idx_user_sessions_last_activity on public.user_sessions (last_activity desc);

comment on table public.user_sessions is 'Tracks last API activity per user for sliding inactivity timeouts.';
comment on column public.user_sessions.last_activity is 'Timestamp of the most recent authenticated API call for this user.';
