-- Run these in Supabase → SQL → New query to confirm demo data is present.
-- You should see: ~13 students, many progress rows, non-zero events, recent updated_at on progress.

select 'students' as tbl, count(*)::text as n from students
union all select 'student_progress', count(*)::text from student_progress
union all select 'events', count(*)::text from events
union all select 'modules', count(*)::text from modules
union all select 'lessons', count(*)::text from lessons;

-- Latest activity on progress (if all rows are very old, everyone may look "inactive" in the app)
select
  min(updated_at) as oldest_progress_update,
  max(updated_at) as newest_progress_update
from student_progress;

-- Latest events (if empty, the app still uses progress.updated_at, but you should have rows for a full demo)
select max(created_at) as newest_event, min(created_at) as oldest_event from events;
