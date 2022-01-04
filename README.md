# 7pace-timetracker-autofill

Autofill 7pace timetracker in Azure DevOps for lazy people.

## How it works?

- Install dependencies

  ```bash
  npm ci
  ```

- Define an `.env` file.

  ```bash
  START_STR=<Start date YYYY-MM-DD>
  END_STR=<End date YYYY-MM-DD (included)>
  USER_ID=<Your user ID>
  BEARER_TOKEN=<Bearer Token retrieved from Chrome developer Tools>
  TOKEN=<Token retrieved from Chrome developer Tools>
  X_CUSTOM_HEADER=<Token retrieved from Chrome developer Tools>
  ```

- Run node script.

  ```bash
  node index.js
  ```
