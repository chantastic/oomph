- Prefer flat data, composed by join tables
- The individual user is the administer of the "org". Assignees are like "members"
- Everything is a filter
  - Any task can be completed on any day
  - Schedules and assignees are a way of drawing and filtering views/forms
- Prefer url structures like /week, /day
  - Provide filtering data (assignee and date/range) as query parameters
  - This should allow for easy "view as" or "view on"
- Use `cron` for scheduling logic
- Use `/week` as the core administrative and reporting view (for now)
- Use `Assignment` as the core logical administrative value, previously `user_task_schedule`

Next:

- Add `User` concept: login, restricted records (Assignees), etc.
- Figure out auth. Why doesn't it work? Stay with Convex Auth?
- Rock would like to some type of "locking" (like the row/column turns green) when days and/or assignments are completed
