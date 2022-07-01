# 7pace-timetracker-autofill

Autofill 7pace timetracker in Azure DevOps for lazy people.

- [7pace-timetracker-autofill](#7pace-timetracker-autofill)
  - [How it works?](#how-it-works)
    - [Local installation](#local-installation)
      - [CLI mode](#cli-mode)
      - [Env file mode](#env-file-mode)
  - [Reporting API token](#reporting-api-token)
  - [License](#license)

## How it works?

### Local installation

- Download project

  ```bash
  # SSH
  git clone git@github.com:VictorRos/7pace-timetracker-autofill.git
  ```

  ```bash
  # HTTPS
  git clone https://github.com/VictorRos/7pace-timetracker-autofill.git
  ```

- Install NPM dependencies

  ```bash
  npm ci
  ```

#### CLI mode

- Run node script.

  ```bash
  node index.js \
    --start-date=<Start date YYYY-MM-DD> \
    --end-date=<End date YYYY-MM-DD (included)> \
    --time-tracker-api-token=<Reporting API Token>
  ```

#### Env file mode

- Define an `.env` file in downloaded project.

  ```bash
  # Start and end dates
  TIME_TRACKER_START_DATE=<Start date YYYY-MM-DD>
  TIME_TRACKER_END_DATE=<End date YYYY-MM-DD (included)>

  # Time tracker Reporting API token
  TIME_TRACKER_API_TOKEN=<Reporting API Token>
  ```

- Run node script.

  ```bash
  node index.js
  ```

## Reporting API token

**Reporting API token** is a personal token you can generate in Azure DevOps.

How to get secret **Reporting API token**

[![Reporting API token video](https://img.youtube.com/vi/g2xyQtOhqS4/0.jpg)](https://www.youtube.com/watch?v=g2xyQtOhqS4 "Everything Is AWESOME")

## License

See [LICENSE](./LICENSE)
