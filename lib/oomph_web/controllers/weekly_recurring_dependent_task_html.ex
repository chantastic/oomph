defmodule OomphWeb.WeeklyRecurringDependentTaskHTML do
  use OomphWeb, :html

  embed_templates "weekly_recurring_dependent_task_html/*"

  @doc """
  Renders a weekly_recurring_dependent_task form.
  """
  attr :changeset, Ecto.Changeset, required: true
  attr :action, :string, required: true

  def weekly_recurring_dependent_task_form(assigns)
end
