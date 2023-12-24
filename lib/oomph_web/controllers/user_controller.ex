defmodule OomphWeb.UserController do
  use OomphWeb, :controller

  alias Oomph.Dependents
  alias Oomph.Dependents.User

  def index(conn, _params) do
    dependent_users = Dependents.list_dependent_users()
    render(conn, :index, dependent_users: dependent_users)
  end

  def new(conn, _params) do
    changeset = Dependents.change_user(%User{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"user" => user_params}) do
    case Dependents.create_user(user_params) do
      {:ok, user} ->
        conn
        |> put_flash(:info, "User created successfully.")
        |> redirect(to: ~p"/dependent_users/#{user}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    user = Dependents.get_user!(id)
    render(conn, :show, user: user)
  end

  def edit(conn, %{"id" => id}) do
    user = Dependents.get_user!(id)
    changeset = Dependents.change_user(user)
    render(conn, :edit, user: user, changeset: changeset)
  end

  def update(conn, %{"id" => id, "user" => user_params}) do
    user = Dependents.get_user!(id)

    case Dependents.update_user(user, user_params) do
      {:ok, user} ->
        conn
        |> put_flash(:info, "User updated successfully.")
        |> redirect(to: ~p"/dependent_users/#{user}")

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :edit, user: user, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = Dependents.get_user!(id)
    {:ok, _user} = Dependents.delete_user(user)

    conn
    |> put_flash(:info, "User deleted successfully.")
    |> redirect(to: ~p"/dependent_users")
  end
end
