import DateFNS from "date-fns";
import Axios from "axios";

import ContextManager from "./ContextManager.js";
import Logger from "./Logger.js";

class TimeTrackerAPI {
    static API_VERSION = "api-version=3.2-beta";

    /**
     * Returns data from response.
     * @param {AxiosResponse} _response Response.
     * @returns {object} Data from response.
     */
    static handleResponse(_response) {
        if (_response.status >= 200 && _response.status < 300) {
            return _response.data;
        } else {
            Logger.error(`${_response.status} - ${_response.statusText}`);
            return null;
        }
    }

    /**
     * Returns Work Logs data for a specific date.
     * @param {Date} _date Date.
     * @returns {Promise<object>} Work Logs data.
     * @public
     */
    static async getWorkLogs(_date) {
        const year = DateFNS.format(_date, "yyyy");
        const month = DateFNS.format(_date, "MM");
        const day = DateFNS.format(_date, "dd");

        const response = await Axios.get(
            `https://cegid.timehub.7pace.com/api/rest/workLogs?${TimeTrackerAPI.API_VERSION}&$fromTimestamp=${year}-${month}-${day}T00:00:00&$toTimestamp=${year}-${month}-${day}T23:59:00`,
            {
                headers: {
                    'Authorization': `Bearer ${ContextManager.get().timeTrackerApiToken}`,
                }
            }
        );

        return this.handleResponse(response);
    }

    /**
     * Get information about yourself.
     * It is possible to use the $expand parameter with this endpoint.
     * The possible options are { user.displayName }.
     * @returns {Promise<object>} User info data.
     * @public
     */
    static async getMe() {
        const response = await Axios.get(
            `https://cegid.timehub.7pace.com/api/rest/me?${TimeTrackerAPI.API_VERSION}`,
            {
                headers: {
                    'Authorization': `Bearer ${ContextManager.get().timeTrackerApiToken}`,
                }
            }
        );

        return this.handleResponse(response);
    }

    /**
     * Delete a work log.
     * @param {string} _workLogId Work log ID.
     * @returns {Promise<object>} Deleted Work log data.
     * @public
     */
    static async deleteWorkLog(_workLogId) {
        const response = await Axios.delete(
            `https://cegid.timehub.7pace.com/api/rest/workLogs/${_workLogId}?${TimeTrackerAPI.API_VERSION}`,
            {
                headers: {
                    'Authorization': `Bearer ${ContextManager.get().timeTrackerApiToken}`,
                }
            }
        );

        return this.handleResponse(response);
    }

    /**
     * Create new Work Logs.
     * @param {object} _postData Data to send.
     * @return {Promise<void>} Nothing.
     * @public
     */
    static async createWorkLogs(_postData) {
        const response = await Axios.post(
            `https://cegid.timehub.7pace.com/api/rest/workLogs?${TimeTrackerAPI.API_VERSION}`,
            _postData,
            {
                headers: {
                    'Authorization': `Bearer ${ContextManager.get().timeTrackerApiToken}`,
                }
            }
        );

        return this.handleResponse(response);
    }
}

export default TimeTrackerAPI;
export {
    TimeTrackerAPI
};
