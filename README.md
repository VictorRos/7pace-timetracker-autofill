# 7pace-timetracker-autofill

Autofill 7pace timetracker in Azure DevOps for lazy people.

## How it works?

- Install dependencies

  ```bash
  npm ci
  ```

- Define an `.env` file.

  ```bash
  # Start and end dates
  START_STR=<Start date YYYY-MM-DD>
  END_STR=<End date YYYY-MM-DD (included)>

  # User ID
  USER_ID=<Your user ID>

  # Time tracker
  BEARER_TOKEN=<Bearer Token retrieved from Chrome developer Tools>
  COOKIE=<Cookie retrieved from Chrome developer Tools>
  TOKEN=<Token retrieved from Chrome developer Tools>
  X_CUSTOM_HEADER=<Token retrieved from Chrome developer Tools>
  ```

  1. Open **Chrome developer Tools** when you are on Timetracke Monthly page.

  2. Select a day with existing work logs.
  
     Retrieve `COOKIE` and `X_CUSTOM_HEADER` from the API call.

  3. Modify one work log then click on **Save**.

     Retrieve `BEARER_TOKEN` and `TOKEN` from the API call.

- Run node script.

  ```bash
  node index.js
  ```
