# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :oomph,
  ecto_repos: [Oomph.Repo],
  generators: [timestamp_type: :utc_datetime]

# Configures the endpoint
config :oomph, OomphWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Phoenix.Endpoint.Cowboy2Adapter,
  render_errors: [
    formats: [html: OomphWeb.ErrorHTML, json: OomphWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Oomph.PubSub,
  live_view: [signing_salt: "QK+lHKMD"]

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :oomph, Oomph.Mailer, adapter: Swoosh.Adapters.Local

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.17.11",
  default: [
    args:
      ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "3.3.2",
  default: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :kaffy,
  otp_app: :oomph,
  ecto_repo: Oomph.Repo,
  router: OomphWeb.Router,
  hide_dashboard: true,
  admin_title: "Oomph Admin",
  # admin_logo: [
  #   url: "https://example.com/img/logo.png",
  #   style: "width:200px;height:66px;"
  # ],
  # admin_logo_mini: "/images/logo-mini.png",
  home_page: [schema: [:accounts, :user]],
  enable_context_dashboards: true,
  admin_footer: "Kaffy &copy; 2023"

config :sentry,
  dsn: System.get_env("SENTRY_DSN"),
  environment_name: Mix.env(),
  enable_source_code_context: true,
  root_source_code_paths: [File.cwd!()]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
