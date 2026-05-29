-- Run after migration_teacher_intervention.sql.
-- Adds parent_email to demo students and seeds last week's intervention history for Drew, Jordan, Morgan.

update students set parent_email = 'mia.parent@demo.edu'    where id = 'a1111111-1111-1111-1111-111111111101';
update students set parent_email = 'sam.parent@demo.edu'    where id = 'a1111111-1111-1111-1111-111111111102';
update students set parent_email = 'riley.parent@demo.edu'  where id = 'a1111111-1111-1111-1111-111111111103';
update students set parent_email = 'zoe.parent@demo.edu'    where id = 'a1111111-1111-1111-1111-111111111104';
update students set parent_email = 'alex.parent@demo.edu'   where id = 'a1111111-1111-1111-1111-111111111105';
update students set parent_email = 'jamie.parent@demo.edu'  where id = 'a1111111-1111-1111-1111-111111111106';
update students set parent_email = 'casey.parent@demo.edu'  where id = 'a1111111-1111-1111-1111-111111111107';
update students set parent_email = 'taylor.parent@demo.edu' where id = 'a1111111-1111-1111-1111-111111111108';
update students set parent_email = 'jordan.parent@demo.edu' where id = 'a1111111-1111-1111-1111-111111111109';
update students set parent_email = 'morgan.parent@demo.edu' where id = 'a1111111-1111-1111-1111-111111111110';
update students set parent_email = 'drew.parent@demo.edu'   where id = 'a1111111-1111-1111-1111-111111111111';
update students set parent_email = 'blake.parent@demo.edu'  where id = 'a1111111-1111-1111-1111-111111111112';
update students set parent_email = 'emery.parent@demo.edu'  where id = 'a1111111-1111-1111-1111-111111111113';

-- Drew Patel: teacher was notified last week (still inactive this week → 2nd week)
insert into intervention_logs
  (student_id, action_type, cohort_tier, student_email_draft, parent_email_draft, emails_sent_at, logged_at, is_seed)
values (
  'a1111111-1111-1111-1111-111111111111',
  'escalated',
  'needs_intervention',
  null,
  null,
  now() - interval '7 days',
  now() - interval '7 days',
  true
);

-- Jordan Blake: nudge email was sent last week (still nudge this week → 2nd week)
insert into intervention_logs
  (student_id, action_type, cohort_tier, student_email_draft, parent_email_draft, emails_sent_at, logged_at, is_seed)
values (
  'a1111111-1111-1111-1111-111111111109',
  'nudge',
  'needs_nudge',
  null,
  null,
  now() - interval '7 days',
  now() - interval '7 days',
  true
);

-- Morgan Lee: support email was sent last week (still inactive this week → 2nd week)
insert into intervention_logs
  (student_id, action_type, cohort_tier, student_email_draft, parent_email_draft, emails_sent_at, logged_at, is_seed)
values (
  'a1111111-1111-1111-1111-111111111110',
  'support',
  'needs_intervention',
  null,
  null,
  now() - interval '7 days',
  now() - interval '7 days',
  true
);
