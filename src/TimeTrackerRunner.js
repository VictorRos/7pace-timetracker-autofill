import DateFNS from "date-fns";
import getPublicDays from "@socialgouv/jours-feries";

import ContextManager from "./ContextManager.js";
import Logger from "./Logger.js";
import TimeTrackerAPI from "./TimeTrackerAPI.js";

// Constantes
const ONE_HOUR_IN_SEC = 3600;
const ACTIVITY_PROJECT_MANAGEMENT = "d968a6e5-6d9f-4fa2-b248-5201bd9a3015"; // 00. Project management and meetings
const ACTIVITY_DEVELOPMENT = "c30c3a6d-aacd-46b2-833d-acd3d33d830d"; // 03. Development
const ACTIVITY_SAAS_OPERATION = "6e00c587-525c-4c1d-880e-0e20fd815dd5"; // 01. Deployment: SAAS Opérations
const ACTIVITY_DAY_OFF = "61e63283-5eec-4853-9a1a-a15550da0d46"; // 17. OoB : Time off
const STATIC_WORKING_DAY_TASKS = [
    {lengthInHour: 1, activityTypeId: ACTIVITY_PROJECT_MANAGEMENT, comment: "Daily DevOps & Réunions diverses"},
    {lengthInHour: 3, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "DevOps"}
];
const REMAINING_HOURS = 3;
const DYNAMIC_WORKING_DAY_TASKS = [
    {lengthInHour: 0, activityType: ACTIVITY_DEVELOPMENT,    comment: "Dev + PRs"},
    {lengthInHour: 0, activityType: ACTIVITY_SAAS_OPERATION, comment: "Support Production"},
    {lengthInHour: 0, activityType: ACTIVITY_SAAS_OPERATION, comment: "Support Dev"}
];
const PUBLIC_DAY_TASKS = [
    {lengthInHour: 7, activityTypeId: ACTIVITY_DAY_OFF, comment: "Jour férié"}
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
     * Randomly generate a number between min and max.
     * @param {Number} min Minimum value.
     * @param {Number} max Maximum value.
     * @returns {Number} Random number.
     */
    static between(min, max) {
        return Math.floor(
            Math.random() * (max - min + 1) + min
        )
    }

    /**
     * Create tasks for the specified date.
     * @param {Date} _date Date.
     * @param {String} _userId User id.
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
            while (hours < REMAINING_HOURS) {
                const randHours = TimeTrackerRunner.between(0, neededHours);
                const randType = TimeTrackerRunner.between(0, DYNAMIC_WORKING_DAY_TASKS.length - 1);
                // Update task hours
                DYNAMIC_WORKING_DAY_TASKS[randType].lengthInHour += randHours;
                hours += randHours;
                neededHours = REMAINING_HOURS - hours;
            }
            // Add dynamic tasks
            tasks = tasks.concat(
                // Filter empty tasks
                DYNAMIC_WORKING_DAY_TASKS.filter((_task) => _task.lengthInHour > 0)
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
        let startDate = DateFNS.parse(ContextManager.get().startDate, "yyyy-MM-dd", new Date());
        const endDate = DateFNS.parse(ContextManager.get().endDate, "yyyy-MM-dd", new Date());

        Logger.info("Start Time tracker");

        const me = await TimeTrackerAPI.getMe(); 

        // Loop through startDate to endDate
        while (DateFNS.isBefore(startDate, endDate) || DateFNS.isEqual(startDate, endDate)) {
            const displayDate = DateFNS.format(startDate, "eeee dd MMMM yyyy");
            Logger.info(`\n${displayDate}`);

            const workLogs = await TimeTrackerAPI.getWorkLogs(startDate);
            if (workLogs?.data?.length === 0) {
                await this.createTasks(startDate, me.data.user.id);
            } else {
                // TODO: Fill with a work log to make 7 hours a day
                Logger.info("Work logs already exist.");
            }

            // Update to next day
            startDate = DateFNS.add(startDate, {days: 1});
        }
    }
}

export default TimeTrackerRunner;
export {
    TimeTrackerRunner
};
