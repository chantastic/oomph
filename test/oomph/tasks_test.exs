defmodule Oomph.TasksTest do
  use Oomph.DataCase

  alias Oomph.Tasks

  describe "weekly_recurring_dependent_tasks" do
    alias Oomph.Tasks.WeeklyRecurringDependentTask

    import Oomph.TasksFixtures

    @invalid_attrs %{description: nil, title: nil, dependent_name: nil, ruccurance_schedule: nil}

    test "list_weekly_recurring_dependent_tasks/0 returns all weekly_recurring_dependent_tasks" do
      weekly_recurring_dependent_task = weekly_recurring_dependent_task_fixture()
      assert Tasks.list_weekly_recurring_dependent_tasks() == [weekly_recurring_dependent_task]
    end

    test "get_weekly_recurring_dependent_task!/1 returns the weekly_recurring_dependent_task with given id" do
      weekly_recurring_dependent_task = weekly_recurring_dependent_task_fixture()
      assert Tasks.get_weekly_recurring_dependent_task!(weekly_recurring_dependent_task.id) == weekly_recurring_dependent_task
    end

    test "create_weekly_recurring_dependent_task/1 with valid data creates a weekly_recurring_dependent_task" do
      valid_attrs = %{description: "some description", title: "some title", dependent_name: "some dependent_name", ruccurance_schedule: 42}

      assert {:ok, %WeeklyRecurringDependentTask{} = weekly_recurring_dependent_task} = Tasks.create_weekly_recurring_dependent_task(valid_attrs)
      assert weekly_recurring_dependent_task.description == "some description"
      assert weekly_recurring_dependent_task.title == "some title"
      assert weekly_recurring_dependent_task.dependent_name == "some dependent_name"
      assert weekly_recurring_dependent_task.ruccurance_schedule == 42
    end

    test "create_weekly_recurring_dependent_task/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Tasks.create_weekly_recurring_dependent_task(@invalid_attrs)
    end

    test "update_weekly_recurring_dependent_task/2 with valid data updates the weekly_recurring_dependent_task" do
      weekly_recurring_dependent_task = weekly_recurring_dependent_task_fixture()
      update_attrs = %{description: "some updated description", title: "some updated title", dependent_name: "some updated dependent_name", ruccurance_schedule: 43}

      assert {:ok, %WeeklyRecurringDependentTask{} = weekly_recurring_dependent_task} = Tasks.update_weekly_recurring_dependent_task(weekly_recurring_dependent_task, update_attrs)
      assert weekly_recurring_dependent_task.description == "some updated description"
      assert weekly_recurring_dependent_task.title == "some updated title"
      assert weekly_recurring_dependent_task.dependent_name == "some updated dependent_name"
      assert weekly_recurring_dependent_task.ruccurance_schedule == 43
    end

    test "update_weekly_recurring_dependent_task/2 with invalid data returns error changeset" do
      weekly_recurring_dependent_task = weekly_recurring_dependent_task_fixture()
      assert {:error, %Ecto.Changeset{}} = Tasks.update_weekly_recurring_dependent_task(weekly_recurring_dependent_task, @invalid_attrs)
      assert weekly_recurring_dependent_task == Tasks.get_weekly_recurring_dependent_task!(weekly_recurring_dependent_task.id)
    end

    test "delete_weekly_recurring_dependent_task/1 deletes the weekly_recurring_dependent_task" do
      weekly_recurring_dependent_task = weekly_recurring_dependent_task_fixture()
      assert {:ok, %WeeklyRecurringDependentTask{}} = Tasks.delete_weekly_recurring_dependent_task(weekly_recurring_dependent_task)
      assert_raise Ecto.NoResultsError, fn -> Tasks.get_weekly_recurring_dependent_task!(weekly_recurring_dependent_task.id) end
    end

    test "change_weekly_recurring_dependent_task/1 returns a weekly_recurring_dependent_task changeset" do
      weekly_recurring_dependent_task = weekly_recurring_dependent_task_fixture()
      assert %Ecto.Changeset{} = Tasks.change_weekly_recurring_dependent_task(weekly_recurring_dependent_task)
    end
  end
end
