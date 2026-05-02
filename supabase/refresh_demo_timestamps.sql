-- Optional: run if you set COACH_TIME_ANCHOR=wall and old seed data makes everyone look inactive.
-- With the default (anchored to the dataset in the app), you usually do not need this.

do $$
declare
  s interval;
  mx timestamptz;
begin
  select max(updated_at) into mx from student_progress;
  if mx is null then
    raise notice 'No student_progress rows — run seed.sql first.';
    return;
  end if;
  s := (now() - interval '1 day') - mx;
  update student_progress set updated_at = updated_at + s;
  if exists (select 1 from events limit 1) then
    update events set created_at = created_at + s;
  end if;
  raise notice 'Shifted demo clocks by %', s;
end $$;
