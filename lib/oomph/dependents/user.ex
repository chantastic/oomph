defmodule Oomph.Dependents.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "dependent_users" do
    field :name, :string
    field :account_user_id, :id

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end
end
