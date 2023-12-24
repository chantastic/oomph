defmodule Oomph.Repo.Migrations.CreateDependentUsers do
  use Ecto.Migration

  def change do
    create table(:dependent_users) do
      add :name, :string
      add :account_user_id, references(:users, on_delete: :nothing)

      timestamps(type: :utc_datetime)
    end

    create index(:dependent_users, [:account_user_id])
  end
end
