defmodule Oomph.TasksFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Oomph.Tasks` context.
  """

  @doc """
  Generate a weekly_recurring_dependent_task.
  """
  def weekly_recurring_dependent_task_fixture(attrs \\ %{}) do
    {:ok, weekly_recurring_dependent_task} =
      attrs
      |> Enum.into(%{
        dependent_name: "some dependent_name",
        description: "some description",
        ruccurance_schedule: 42,
        title: "some title"
      })
      |> Oomph.Tasks.create_weekly_recurring_dependent_task()

    weekly_recurring_dependent_task
  end
end
