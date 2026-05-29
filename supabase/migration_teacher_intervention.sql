-- Run after schema.sql and seed.sql.
-- Adds parent_email to students and creates intervention_logs table.

alter table students add column if not exists parent_email text;

create table if not exists intervention_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  action_type text not null check (action_type in ('support', 'nudge', 'on_track', 'escalated')),
  cohort_tier text not null check (cohort_tier in ('needs_intervention', 'needs_nudge', 'on_track')),
  student_email_draft text,
  parent_email_draft text,
  emails_sent_at timestamptz,
  logged_at timestamptz not null default now(),
  is_seed boolean not null default false
);

create index if not exists idx_intervention_logs_student on intervention_logs (student_id);
create index if not exists idx_intervention_logs_logged on intervention_logs (logged_at desc);
