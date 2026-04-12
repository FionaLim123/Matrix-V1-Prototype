-- Run this first in Supabase SQL Editor (new project).
-- Plain English: defines tables for students, content structure, progress, and behaviour events.

create extension if not exists "pgcrypto";

create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  order_index int not null default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules (id) on delete cascade,
  title text not null,
  is_revision boolean not null default false,
  order_index int not null default 0
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons (id) on delete cascade,
  title text not null
);

create table student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  status text not null check (status in ('not_started', 'in_progress', 'completed')),
  last_quiz_score_percent numeric,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in (
      'lesson_opened',
      'lesson_completed',
      'quiz_started',
      'quiz_submitted',
      'score_received',
      'video_started',
      'video_watched_80_percent',
      'coach_opened',
      'recommendation_accepted'
    )
  ),
  student_id uuid not null references students (id) on delete cascade,
  course_id uuid references courses (id) on delete set null,
  module_id uuid references modules (id) on delete set null,
  lesson_id uuid references lessons (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_events_student on events (student_id);
create index idx_events_type on events (event_type);
create index idx_events_created on events (created_at desc);
