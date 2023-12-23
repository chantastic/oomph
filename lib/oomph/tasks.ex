defmodule Oomph.Tasks do
  @moduledoc """
  The Tasks context.
  """

  import Ecto.Query, warn: false
  alias Oomph.Repo

  alias Oomph.Tasks.WeeklyRecurringDependentTask

  @doc """
  Returns the list of weekly_recurring_dependent_tasks.

  ## Examples

      iex> list_weekly_recurring_dependent_tasks()
      [%WeeklyRecurringDependentTask{}, ...]

  """
  def list_weekly_recurring_dependent_tasks do
    Repo.all(WeeklyRecurringDependentTask)
  end

  @doc """
  Gets a single weekly_recurring_dependent_task.

  Raises `Ecto.NoResultsError` if the Weekly recurring dependent task does not exist.

  ## Examples

      iex> get_weekly_recurring_dependent_task!(123)
      %WeeklyRecurringDependentTask{}

      iex> get_weekly_recurring_dependent_task!(456)
      ** (Ecto.NoResultsError)

  """
  def get_weekly_recurring_dependent_task!(id), do: Repo.get!(WeeklyRecurringDependentTask, id)

  @doc """
  Creates a weekly_recurring_dependent_task.

  ## Examples

      iex> create_weekly_recurring_dependent_task(%{field: value})
      {:ok, %WeeklyRecurringDependentTask{}}

      iex> create_weekly_recurring_dependent_task(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_weekly_recurring_dependent_task(attrs \\ %{}) do
    %WeeklyRecurringDependentTask{}
    |> WeeklyRecurringDependentTask.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a weekly_recurring_dependent_task.

  ## Examples

      iex> update_weekly_recurring_dependent_task(weekly_recurring_dependent_task, %{field: new_value})
      {:ok, %WeeklyRecurringDependentTask{}}

      iex> update_weekly_recurring_dependent_task(weekly_recurring_dependent_task, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_weekly_recurring_dependent_task(%WeeklyRecurringDependentTask{} = weekly_recurring_dependent_task, attrs) do
    weekly_recurring_dependent_task
    |> WeeklyRecurringDependentTask.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a weekly_recurring_dependent_task.

  ## Examples

      iex> delete_weekly_recurring_dependent_task(weekly_recurring_dependent_task)
      {:ok, %WeeklyRecurringDependentTask{}}

      iex> delete_weekly_recurring_dependent_task(weekly_recurring_dependent_task)
      {:error, %Ecto.Changeset{}}

  """
  def delete_weekly_recurring_dependent_task(%WeeklyRecurringDependentTask{} = weekly_recurring_dependent_task) do
    Repo.delete(weekly_recurring_dependent_task)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking weekly_recurring_dependent_task changes.

  ## Examples

      iex> change_weekly_recurring_dependent_task(weekly_recurring_dependent_task)
      %Ecto.Changeset{data: %WeeklyRecurringDependentTask{}}

  """
  def change_weekly_recurring_dependent_task(%WeeklyRecurringDependentTask{} = weekly_recurring_dependent_task, attrs \\ %{}) do
    WeeklyRecurringDependentTask.changeset(weekly_recurring_dependent_task, attrs)
  end
end
