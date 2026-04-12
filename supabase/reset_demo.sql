-- Clears demo tables so you can re-run seed.sql on an existing Supabase project.
-- Run in SQL Editor, then run seed.sql.

truncate table events, student_progress, quizzes, lessons, modules, courses, students restart identity cascade;
