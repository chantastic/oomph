defmodule OomphWeb.WeeklyRecurringDependentTaskController do
  use OomphWeb, :controller

  alias Oomph.Tasks
  alias Oomph.Tasks.WeeklyRecurringDependentTask
  alias Oomph.Accounts.User
  alias Oomph.Repo

  def index(conn, _params) do
    weekly_recurring_dependent_tasks = Tasks.list_weekly_recurring_dependent_tasks()
    render(conn, :index, weekly_recurring_dependent_tasks: weekly_recurring_dependent_tasks)
  end

  def new(conn, _params) do
    changeset = Tasks.change_weekly_recurring_dependent_task(%WeeklyRecurringDependentTask{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"weekly_recurring_dependent_task" => weekly_recurring_dependent_task_params}) do
    case Tasks.create_weekly_recurring_dependent_task(weekly_recurring_dependent_task_params) do
      {:ok, weekly_recurring_dependent_task} ->
        conn
        |> put_flash(:info, "Weekly recurring dependent task created successfully.")
        |> redirect(to: ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    weekly_recurring_dependent_task = Tasks.get_weekly_recurring_dependent_task!(id)
    author = Repo.get!(User, weekly_recurring_dependent_task.author_id)

    render(conn, :show,
      weekly_recurring_dependent_task: weekly_recurring_dependent_task,
      author: author
    )
  end

  def edit(conn, %{"id" => id}) do
    weekly_recurring_dependent_task = Tasks.get_weekly_recurring_dependent_task!(id)
    changeset = Tasks.change_weekly_recurring_dependent_task(weekly_recurring_dependent_task)

    render(conn, :edit,
      weekly_recurring_dependent_task: weekly_recurring_dependent_task,
      changeset: changeset
    )
  end

  def update(conn, %{
        "id" => id,
        "weekly_recurring_dependent_task" => weekly_recurring_dependent_task_params
      }) do
    weekly_recurring_dependent_task = Tasks.get_weekly_recurring_dependent_task!(id)

    case Tasks.update_weekly_recurring_dependent_task(
           weekly_recurring_dependent_task,
           weekly_recurring_dependent_task_params
         ) do
      {:ok, weekly_recurring_dependent_task} ->
        conn
        |> put_flash(:info, "Weekly recurring dependent task updated successfully.")
        |> redirect(to: ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit,
          weekly_recurring_dependent_task: weekly_recurring_dependent_task,
          changeset: changeset
        )
    end
  end

  def delete(conn, %{"id" => id}) do
    weekly_recurring_dependent_task = Tasks.get_weekly_recurring_dependent_task!(id)

    {:ok, _weekly_recurring_dependent_task} =
      Tasks.delete_weekly_recurring_dependent_task(weekly_recurring_dependent_task)

    conn
    |> put_flash(:info, "Weekly recurring dependent task deleted successfully.")
    |> redirect(to: ~p"/weekly_recurring_dependent_tasks")
  end
end
