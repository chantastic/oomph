defmodule OomphWeb.WeeklyRecurringDependentTaskControllerTest do
  use OomphWeb.ConnCase

  import Oomph.TasksFixtures

  @create_attrs %{description: "some description", title: "some title", dependent_name: "some dependent_name", ruccurance_schedule: 42}
  @update_attrs %{description: "some updated description", title: "some updated title", dependent_name: "some updated dependent_name", ruccurance_schedule: 43}
  @invalid_attrs %{description: nil, title: nil, dependent_name: nil, ruccurance_schedule: nil}

  describe "index" do
    test "lists all weekly_recurring_dependent_tasks", %{conn: conn} do
      conn = get(conn, ~p"/weekly_recurring_dependent_tasks")
      assert html_response(conn, 200) =~ "Listing Weekly recurring dependent tasks"
    end
  end

  describe "new weekly_recurring_dependent_task" do
    test "renders form", %{conn: conn} do
      conn = get(conn, ~p"/weekly_recurring_dependent_tasks/new")
      assert html_response(conn, 200) =~ "New Weekly recurring dependent task"
    end
  end

  describe "create weekly_recurring_dependent_task" do
    test "redirects to show when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/weekly_recurring_dependent_tasks", weekly_recurring_dependent_task: @create_attrs)

      assert %{id: id} = redirected_params(conn)
      assert redirected_to(conn) == ~p"/weekly_recurring_dependent_tasks/#{id}"

      conn = get(conn, ~p"/weekly_recurring_dependent_tasks/#{id}")
      assert html_response(conn, 200) =~ "Weekly recurring dependent task #{id}"
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/weekly_recurring_dependent_tasks", weekly_recurring_dependent_task: @invalid_attrs)
      assert html_response(conn, 200) =~ "New Weekly recurring dependent task"
    end
  end

  describe "edit weekly_recurring_dependent_task" do
    setup [:create_weekly_recurring_dependent_task]

    test "renders form for editing chosen weekly_recurring_dependent_task", %{conn: conn, weekly_recurring_dependent_task: weekly_recurring_dependent_task} do
      conn = get(conn, ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}/edit")
      assert html_response(conn, 200) =~ "Edit Weekly recurring dependent task"
    end
  end

  describe "update weekly_recurring_dependent_task" do
    setup [:create_weekly_recurring_dependent_task]

    test "redirects when data is valid", %{conn: conn, weekly_recurring_dependent_task: weekly_recurring_dependent_task} do
      conn = put(conn, ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}", weekly_recurring_dependent_task: @update_attrs)
      assert redirected_to(conn) == ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}"

      conn = get(conn, ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}")
      assert html_response(conn, 200) =~ "some updated description"
    end

    test "renders errors when data is invalid", %{conn: conn, weekly_recurring_dependent_task: weekly_recurring_dependent_task} do
      conn = put(conn, ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}", weekly_recurring_dependent_task: @invalid_attrs)
      assert html_response(conn, 200) =~ "Edit Weekly recurring dependent task"
    end
  end

  describe "delete weekly_recurring_dependent_task" do
    setup [:create_weekly_recurring_dependent_task]

    test "deletes chosen weekly_recurring_dependent_task", %{conn: conn, weekly_recurring_dependent_task: weekly_recurring_dependent_task} do
      conn = delete(conn, ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}")
      assert redirected_to(conn) == ~p"/weekly_recurring_dependent_tasks"

      assert_error_sent 404, fn ->
        get(conn, ~p"/weekly_recurring_dependent_tasks/#{weekly_recurring_dependent_task}")
      end
    end
  end

  defp create_weekly_recurring_dependent_task(_) do
    weekly_recurring_dependent_task = weekly_recurring_dependent_task_fixture()
    %{weekly_recurring_dependent_task: weekly_recurring_dependent_task}
  end
end
