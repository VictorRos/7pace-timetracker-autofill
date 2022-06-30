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
const WORKING_DAY_TASKS = [
    {lengthInHour: 1, activityTypeId: ACTIVITY_PROJECT_MANAGEMENT, comment: "Daily DevOps & Réunions diverses"},
    {lengthInHour: 0, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "Dev + PRs"},
    {lengthInHour: 3, activityTypeId: ACTIVITY_DEVELOPMENT,        comment: "DevOps"}
];
const randomHours = 3;
const addRandomType = [{
        comment: "Dev + PRs",
        lengthInHour: 0,
        activityType: ACTIVITY_DEVELOPMENT
    },
    {
        comment: "Support Production",
        lengthInHour: 0,
        activityType: ACTIVITY_SAAS_OPERATION
    },
    {
        comment: "Support Dev",
        lengthInHour: 0,
        activityType: ACTIVITY_SAAS_OPERATION
    }
]
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
     * Create tasks for the specified date.
     * @param {Date} _date Date.
     * @returns {Promise<void>} Nothing.
     * @private
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
            userId: ContextManager.get().userId
        };

        // Get tasks
        let tasks = [];
        if(this.isPublicDay(_date)) {
            tasks = PUBLIC_DAY_TASKS;
        }
        else { // Working day
            tasks = WORKING_DAY_TASKS;
            // Add random tasks
            let hours = 0;
            let neededHours = randomHours - hours;
            while (hours < randomHours) {
                const randHours = between(0, neededHours);
                const randType = between(0, addRandomTypeCp.length - 1);
                addRandomTypeCp[randType].hours += randHours;
                hours += randHours;
                neededHours = randomHours - hours;
            }
            tasks = tasks.concat(addRandomTypeCp);
            tasks = tasks.filter(task => task.hours > 0);
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

export default TimeTrackerRunner;
export {
    TimeTrackerRunner
};
