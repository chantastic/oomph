defmodule Oomph.Repo do
  use Ecto.Repo,
    otp_app: :oomph,
    adapter: Ecto.Adapters.SQLite3
end
