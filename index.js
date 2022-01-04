import Path from "path";
import {fileURLToPath} from "url";

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

import DateFNS from "date-fns";
import DotEnv from "dotenv";
import getPublicDays from "@socialgouv/jours-feries";

import Logger from "./src/Logger.js";
import TimeTrackerAPI from "./src/TimeTrackerAPI.js";

// Load .env
DotEnv.config({
    path: `${__dirname}/.env`,
    encoding: "utf8"
});

// Constantes
const ONE_HOUR_IN_SEC = 3600;
const ACTIVITY_PROJECT_MANAGEMENT = "fefc33f4-bf69-42b1-9029-d0ac0dbe5714";
const ACTIVITY_DEVELOPMENT = "c30c3a6d-aacd-46b2-833d-acd3d33d830d";
const ACTIVITY_DAY_OFF = "61e63283-5eec-4853-9a1a-a15550da0d46";
const WORKING_DAY_TASKS = [
    {lengthInHour: 1, activityTypeId: ACTIVITY_PROJECT_MANAGEMENT, comment: "Daily DevOps & Réunions diverses"},
    {lengthInHour: 3, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "Dev + PRs"},
    {lengthInHour: 3, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "DevOps"}
];
const PUBLIC_DAY_TASKS = [
    {lengthInHour: 7, activityTypeId: ACTIVITY_DAY_OFF, comment: "Jour férié"}
];

// Variables
// TODO: User yargs to handle inputs
const START_STR = process.env.START_STR;
const END_STR = process.env.END_STR;
const USER_ID = process.env.USER_ID;

// Start program

class TimeTracker {
    /**
     * Check it date is a day off in France.
     * @param {Date} _date Date to check.
     * @returns {boolean} Day off in France or not.
     */
    static isPublicDay(_date) {
        const joursFeries = getPublicDays(DateFNS.getYear(_date));
        return Object.entries(joursFeries).some(([_name, _dateJF]) => {
            return DateFNS.isEqual(_date, _dateJF);
        });
    }

    /**
     * Create tasks for the specified date.
     * @param {Date} _date Date.
     * @returns {Promise<void>} Nothing.
     */
    static async createTasks(_date) {
        // Ignore weekend
        if (DateFNS.isSaturday(_date)) {
            Logger.info("--> Ignore saturdays.");
            return;
        }
        if (DateFNS.isSunday(_date)) {
            Logger.info("--> Ignore sundays.");
            return;
        }

        // Create data common to each task
        const year = DateFNS.format(_date, "yyyy");
        const month = DateFNS.format(_date, "MM");
        const day = DateFNS.format(_date, "dd");
        const commonData = {
            timestamp: `${year}-${month}-${day}T00:00:00.000Z`,
            workItemId: null,
            repoId: null,
            repoFullName: null,
            userId: USER_ID
        };

        // Get tasks
        const tasks = this.isPublicDay(_date)
            ? PUBLIC_DAY_TASKS
            : WORKING_DAY_TASKS;

        // Create tasks
        await tasks.reduce(async (_prom, _task) => {
            await _prom;
            Logger.info(`Add ${_task.lengthInHour} hour(s) with comment "${_task.comment}"`);

            const postData = {
                activityTypeId: _task.activityTypeId,
                length: _task.lengthInHour * ONE_HOUR_IN_SEC,
                comment: _task.comment,
                ...commonData
            };

            await TimeTrackerAPI.createWorkLogs(postData);
        }, Promise.resolve());
    }

    static async run() {
        let startDate = DateFNS.parse(START_STR, "yyyy-MM-dd", new Date());
        const endDate = DateFNS.parse(END_STR, "yyyy-MM-dd", new Date());

        Logger.info("Start Time tracker");

        // Loop through startDate to endDate
        while (DateFNS.isBefore(startDate, endDate) || DateFNS.isEqual(startDate, endDate)) {
            const displayDate = DateFNS.format(startDate, "eeee dd MMMM yyyy");
            Logger.info(`\n${displayDate}`);

            const workLogs = await TimeTrackerAPI.getWorkLogs(startDate);
            if (workLogs?.logs?.length === 0) {
                await this.createTasks(startDate);
            } else {
                // TODO: Fill with a work log to make 7 hours a day
                Logger.info("Work logs already exist.");
            }

            // Update to next day
            startDate = DateFNS.add(startDate, {days: 1});
        }
    }
}

TimeTracker.run();

process.on("unhandledRejection", (_err) => {
    Logger.error(_err);
    process.exitCode = 1;

    // Exit gracefully
    process.nextTick(() => {
        process.exit();
    });
});
