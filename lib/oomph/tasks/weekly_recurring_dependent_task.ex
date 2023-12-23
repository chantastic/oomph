defmodule Oomph.Tasks.WeeklyRecurringDependentTask do
  use Ecto.Schema
  import Ecto.Changeset

  schema "weekly_recurring_dependent_tasks" do
    field :description, :string
    field :title, :string
    field :dependent_name, :string
    field :ruccurance_schedule, :integer
    field :author_id, :id

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(weekly_recurring_dependent_task, attrs) do
    weekly_recurring_dependent_task
    |> cast(attrs, [:title, :description, :dependent_name, :author_id, :ruccurance_schedule])
    |> validate_required([:title, :description, :dependent_name, :author_id, :ruccurance_schedule])
  end
end
