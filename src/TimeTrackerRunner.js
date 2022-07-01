import DateFNS from "date-fns";
import getPublicDays from "@socialgouv/jours-feries";

import ContextManager from "./ContextManager.js";
import Logger from "./Logger.js";
import TimeTrackerAPI from "./TimeTrackerAPI.js";

// Constants
const ONE_HOUR_IN_SEC = 3600;

const ACTIVITY_PROJECT_MANAGEMENT = "d968a6e5-6d9f-4fa2-b248-5201bd9a3015"; // 00. Project management and meetings
const ACTIVITY_SAAS_OPERATION = "6e00c587-525c-4c1d-880e-0e20fd815dd5";     // 01. Deployment: SaaS Operations
const ACTIVITY_DEVELOPMENT = "c30c3a6d-aacd-46b2-833d-acd3d33d830d";        // 03. Development
const ACTIVITY_DAY_OFF = "61e63283-5eec-4853-9a1a-a15550da0d46";            // 17. OoB : Time off

// France public days
const PUBLIC_DAY_TASKS = [
    {lengthInHour: 7, activityTypeId: ACTIVITY_DAY_OFF, comment: "Jour férié"}
];

// Work logs added each day (4 hours)
const STATIC_WORKING_DAY_TASKS = [
    {lengthInHour: 1, activityTypeId: ACTIVITY_PROJECT_MANAGEMENT, comment: "Daily DevOps & Réunions diverses"},
    {lengthInHour: 3, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "DevOps"}
];

// Work logs added randomly each day (3 hours)
const REMAINING_HOURS = 3;
const DYNAMIC_WORKING_DAY_TASKS = [
    {lengthInHour: 0, activityTypeId: ACTIVITY_DEVELOPMENT,    comment: "Dev + PRs"},
    {lengthInHour: 0, activityTypeId: ACTIVITY_SAAS_OPERATION, comment: "Support Production"},
    {lengthInHour: 0, activityTypeId: ACTIVITY_SAAS_OPERATION, comment: "Support Dev"}
];

class TimeTrackerRunner {
    /**
     * Check it date is a day off in France.
     * @param {Date} _date Date to check.
     * @returns {boolean} Day off in France or not.
     * @private
     */
    static isPublicDay(_date) {
        const joursFeries = getPublicDays(DateFNS.getYear(_date));
        return Object.entries(joursFeries).some(([_name, _dateJF]) => {
            return DateFNS.isEqual(_date, _dateJF);
        });
    }

    /**
     * Randomly generate an integer between min and max.
     * @param {Number} min Minimum value.
     * @param {Number} max Maximum value.
     * @returns {Number} Random integer.
     */
    static between(min, max) {
        return Math.floor(
            Math.random() * (max - min + 1) + min
        )
    }

    /**
     * Create tasks for the specified date.
     * @param {Date} _date Date.
     * @param {String} _userId User ID.
     * @returns {Promise<void>} Nothing.
     * @private
     */
    static async createTasks(_date, _userId) {
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
            userId: _userId
        };

        // Get tasks
        let tasks = [];
        if (this.isPublicDay(_date)) {
            tasks = PUBLIC_DAY_TASKS;
        // Working day
        } else {
            tasks = STATIC_WORKING_DAY_TASKS;
            // Add random tasks
            let hours = 0;
            let neededHours = REMAINING_HOURS - hours;
            // Deep copy
            const dynamicWorkingDay = JSON.parse(JSON.stringify(DYNAMIC_WORKING_DAY_TASKS));
            while (hours < REMAINING_HOURS) {
                const randHours = TimeTrackerRunner.between(0, neededHours);
                const randType = TimeTrackerRunner.between(0, dynamicWorkingDay.length - 1);
                // Update task hours
                dynamicWorkingDay[randType].lengthInHour += randHours;
                hours += randHours;
                neededHours = REMAINING_HOURS - hours;
            }
            // Add dynamic tasks
            tasks = tasks.concat(
                // Filter empty tasks
                dynamicWorkingDay.filter((_task) => _task.lengthInHour > 0)
            );
        }

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

    /**
     * Run Time tracker.
     * @returns {Promise<void>} Nothing.
     */
    static async run() {
        const startDate = DateFNS.parse(ContextManager.get().startDate, "yyyy-MM-dd", new Date());
        const endDate = DateFNS.parse(ContextManager.get().endDate, "yyyy-MM-dd", new Date());
        let currentDate = startDate;

        Logger.info("Start Time tracker");

        // Show force mode log once
        if (ContextManager.get().force) {
            Logger.info("\nForce mode enabled ! Delete all existing work logs (except days off)");
        }

        const me = await TimeTrackerAPI.getMe(); 

        // Loop through startDate to endDate
        while (DateFNS.isBefore(currentDate, endDate) || DateFNS.isEqual(currentDate, endDate)) {
            const displayDate = DateFNS.format(currentDate, "eeee dd MMMM yyyy");
            Logger.info(`\n${displayDate}`);

            const workLogs = await TimeTrackerAPI.getWorkLogs(currentDate);
            // No worklogs
            if (workLogs?.data?.length === 0) {
                await this.createTasks(currentDate, me.data.user.id);
            // Existing worklogs
            } else {
                // Override existing work logs
                if (ContextManager.get().force) {
                    const daysOff = workLogs.data.filter((_workLog) => _workLog.activityType?.id === ACTIVITY_DAY_OFF);
                    const hasDaysOff7hours = daysOff.some((_workLog) => _workLog.length === (7 * ONE_HOUR_IN_SEC));

                    // Ignore all days that contain one unique work log of 7 hours days off
                    if (workLogs.data.length === 1 &&
                        workLogs.data[0].activityType?.id === ACTIVITY_DAY_OFF &&
                        workLogs.data[0].length === (7 * ONE_HOUR_IN_SEC)
                    ) {
                        Logger.info(`--> Ignore ${this.isPublicDay(currentDate)? "public days" : "days off"}.`);
                        // Update to next day
                        currentDate = DateFNS.add(currentDate, {days: 1});
                        continue;
                    }

                    // 7 hours days off + other work logs --> Delete other work logs
                    if (hasDaysOff7hours && workLogs.data.length > 1) {
                        Logger.info("Contains 7 hours days off and other work logs --> Delete other work logs.");
                        await Promise.all(
                            workLogs.data
                                .filter((_workLog) => _workLog.activityType?.id !== ACTIVITY_DAY_OFF)
                                .map(async (_workLog) => {
                                    return TimeTrackerAPI.deleteWorkLog(_workLog.id);
                                })
                        );
                        // TODO: Fill with work logs to have 7 hours a day
                    // Contains days off --> Do nothing
                    } else if (daysOff.length > 0) {
                        Logger.info("--> Ignore days containing days off.");
                        // Update to next day
                        currentDate = DateFNS.add(currentDate, {days: 1});
                        continue;
                    // No days off --> Delete work logs
                    } else {
                        Logger.info("Delete all work logs.");
                        await Promise.all(
                            workLogs.data.map(async (_workLog) => {
                                return TimeTrackerAPI.deleteWorkLog(_workLog.id);
                            })
                        );
                        // Fill with work logs to have 7 hours a day
                        await this.createTasks(currentDate, me.data.user.id);
                    }
                // Fill with work logs to have 7 hours a day
                } else {
                    // TODO: Fill with work logs to have 7 hours a day
                    Logger.info("Work logs already exist.");
                }
            }

            // Update to next day
            currentDate = DateFNS.add(currentDate, {days: 1});
        }
    }
}

export default TimeTrackerRunner;
export {
    TimeTrackerRunner
};
