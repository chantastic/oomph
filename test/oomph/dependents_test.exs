defmodule Oomph.DependentsTest do
  use Oomph.DataCase

  alias Oomph.Dependents

  describe "dependent_users" do
    alias Oomph.Dependents.User

    import Oomph.DependentsFixtures

    @invalid_attrs %{name: nil}

    test "list_dependent_users/0 returns all dependent_users" do
      user = user_fixture()
      assert Dependents.list_dependent_users() == [user]
    end

    test "get_user!/1 returns the user with given id" do
      user = user_fixture()
      assert Dependents.get_user!(user.id) == user
    end

    test "create_user/1 with valid data creates a user" do
      valid_attrs = %{name: "some name"}

      assert {:ok, %User{} = user} = Dependents.create_user(valid_attrs)
      assert user.name == "some name"
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Dependents.create_user(@invalid_attrs)
    end

    test "update_user/2 with valid data updates the user" do
      user = user_fixture()
      update_attrs = %{name: "some updated name"}

      assert {:ok, %User{} = user} = Dependents.update_user(user, update_attrs)
      assert user.name == "some updated name"
    end

    test "update_user/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Dependents.update_user(user, @invalid_attrs)
      assert user == Dependents.get_user!(user.id)
    end

    test "delete_user/1 deletes the user" do
      user = user_fixture()
      assert {:ok, %User{}} = Dependents.delete_user(user)
      assert_raise Ecto.NoResultsError, fn -> Dependents.get_user!(user.id) end
    end

    test "change_user/1 returns a user changeset" do
      user = user_fixture()
      assert %Ecto.Changeset{} = Dependents.change_user(user)
    end
  end
end
