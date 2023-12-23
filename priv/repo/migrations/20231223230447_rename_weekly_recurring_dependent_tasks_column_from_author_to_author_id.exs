defmodule Oomph.Repo.Migrations.RenameWeeklyRecurringDependentTasksColumnFromAuthorToAuthorId do
  use Ecto.Migration

  def change do
    rename table(:weekly_recurring_dependent_tasks), :author, to: :author_id
  end
end
