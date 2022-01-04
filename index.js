import Path from "path";
import {exec} from "child_process";
import {promisify} from "util";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

import DateFNS from "date-fns";
import DotEnv from "dotenv";

DotEnv.config({
    path: `${__dirname}/.env`,
    encoding: "utf8",
    debug: true
});

const execCmd = promisify(exec);
// eslint-disable-next-line no-console
const log = (...args) => console.log(...args);
const error = (...args) => console.error(...args);

// TODO: User yargs to handle inputs
const START_STR = process.env.START_STR;
const END_STR = process.env.END_STR;
const USER_ID = process.env.USER_ID;
const BEARER_TOKEN = process.env.BEARER_TOKEN;
const TOKEN = process.env.TOKEN;
const X_CUSTOM_HEADER = process.env.X_CUSTOM_HEADER;

let startDate = DateFNS.parse(START_STR, "yyyy-MM-dd", new Date());
const endDate = DateFNS.parse(END_STR, "yyyy-MM-dd", new Date());

const ONE_HOUR_IN_SEC = 3600;
const ACTIVITY_PROJECT_MANAGEMENT = "fefc33f4-bf69-42b1-9029-d0ac0dbe5714";
const ACTIVITY_DEVELOPMENT = "c30c3a6d-aacd-46b2-833d-acd3d33d830d";
const tasks = [
    {lengthInHour: 1, activityTypeId: ACTIVITY_PROJECT_MANAGEMENT, comment: "Daily DevOps & Réunions diverses"},
    {lengthInHour: 3, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "Dev + PRs"},
    {lengthInHour: 3, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "DevOps"}
];

log("Start Time tracker");

// Loop through startDate to endDate
while (DateFNS.isBefore(startDate, endDate) || DateFNS.isEqual(startDate, endDate)) {
    const displayDate = DateFNS.format(startDate, "eeee dd MMMM yyyy");
    log(`\n${displayDate}`);

    if (DateFNS.isSaturday(startDate)) {
        log("--> Ignore saturdays.");
    } else if (DateFNS.isSunday(startDate)) {
        log("--> Ignore sundays.");
    } else {
        const year = DateFNS.format(startDate, "yyyy");
        const month = DateFNS.format(startDate, "MM");
        const day = DateFNS.format(startDate, "dd");

        tasks.forEach(async (_task) => {
            log(`Add ${_task.lengthInHour} hour(s) with comment "${_task.comment}"`);

            const postData = {
                activityTypeId: _task.activityTypeId,
                length: _task.lengthInHour * ONE_HOUR_IN_SEC,
                comment: _task.comment,
                timestamp: `${year}-${month}-${day}T00:00:00.000Z`,
                workItemId: null,
                repoId: null,
                repoFullName: null,
                userId: USER_ID
            };
            const command = `curl 'https://cegid.timehub.7pace.com/api-internal/rest/worklogs?api-version=3.1' \
                    -H 'accept: application/json, text/plain, */*' \
                    -H 'authority: cegid.timehub.7pace.com' \
                    -H 'authorization: Bearer ${BEARER_TOKEN}' \
                    -H 'client_type: web' \
                    -H 'content-type: application/json;charset=UTF-8' \
                    -H 'origin: https://cegid.timehub.7pace.com' \
                    -H 'page_name: Monthly' \
                    -H 'referer: https://cegid.timehub.7pace.com/' \
                    -H 'sec-ch-ua-mobile: ?0' \
                    -H 'sec-ch-ua-platform: "macOS"' \
                    -H 'sec-ch-ua: " Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"' \
                    -H 'sec-fetch-dest: empty' \
                    -H 'sec-fetch-mode: cors' \
                    -H 'sec-fetch-site: same-origin' \
                    -H 'token: ${TOKEN}' \
                    -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36' \
                    -H 'x-custom-header: ${X_CUSTOM_HEADER}' \
                    --data-raw '${JSON.stringify(postData)}' \
                    --compressed`;

            try {
                await execCmd(command);
            } catch(_err) {
                error(_err);
            }
        });

    }

    // Update to next day
    startDate = DateFNS.add(startDate, {days: 1});
}
