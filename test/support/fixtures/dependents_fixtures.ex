defmodule Oomph.DependentsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Oomph.Dependents` context.
  """

  @doc """
  Generate a user.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        name: "some name"
      })
      |> Oomph.Dependents.create_user()

    user
  end
end
