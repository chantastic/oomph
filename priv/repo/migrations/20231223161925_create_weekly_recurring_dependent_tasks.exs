defmodule Oomph.Repo.Migrations.CreateWeeklyRecurringDependentTasks do
  use Ecto.Migration

  def change do
    create table(:weekly_recurring_dependent_tasks) do
      add :title, :string
      add :description, :string
      add :dependent_name, :string
      add :ruccurance_schedule, :integer
      add :author, references(:users, on_delete: :nothing)

      timestamps(type: :utc_datetime)
    end

    create index(:weekly_recurring_dependent_tasks, [:author])
  end
end
