# 2. Prefer Hidden Form Fields for Implicit Relationships

Date: 2023-12-23

## Status

Accepted

## Context

I want to write certain default relationships to the database.
Specifically, I want to track author data when a task is made.
But authors doesn't need to be aware of the association.

Option #1:
I can enrich the form with this data on the controller, post submission.
The benefit to this is that it's not user tamperable.
The cost is that I can't easily use the same form (as a super admin) to force or fix data.
Architecturally, I am concerned that I will want to reach for [a pattern like this, described, used by Remote](https://remote.com/blog/current-user-in-elixir-phoenix) that convolutes the system for convenience.

Option #2:
I can use a hidden form field, auto-populated with the current user.
The benefit is that it's extremely easy and retains existing, simple form validation.
The cost is that I need to add validation logic that non super admins can't tamper with the hidden field.

## Decision

Use hidden inputs for default associations.

## Consequences

Anywhere that I have a default association, I need validate CREATE and POST events to ensure that `author:id` matches `current_user`
