import DateFNS from "date-fns";
import Axios from "axios";

import ContextManager from "./ContextManager.js";
import Logger from "./Logger.js";

class TimeTrackerAPI {
    static API_REST_URL = "https://cegid.timehub.7pace.com/api/rest";
    static API_VERSION = "3.2-beta";

    /**
     * Returns query params stringified.
     * @param {object} _params Query params.
     * @returns {string} Query params stringified.
     */
    static buildQueryParams(_params = {}) {
        return Object
            .entries({
                ..._params,
                "api-version": this.API_VERSION
            })
            .map(([_key, _value]) => {
                return `${_key}=${encodeURIComponent(_value)}`;
            })
            .join("&");
    }

    /**
     * Returns URL with query params encoded.
     * @param {string} _endpoint Endpoint to reach.
     * @param {object} _params Params.
     * @returns {string} URL with query params encoded.
     */
    static getUrl(_endpoint, _params = {}) {
        const queryParams = this.buildQueryParams(_params);
        return `${this.API_REST_URL}/${_endpoint}?${queryParams}`
    }

    /**
     * Returns headers for request.
     * @param {object} _headers Headers.
     * @returns {object} Headers + API Token.
     */
    static getHeaders(_headers = {}) {
        return {
            ..._headers,
            'Authorization': `Bearer ${ContextManager.get().timeTrackerApiToken}`
        };
    }

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
     * Get information about yourself.
     * It is possible to use the $expand parameter with this endpoint.
     * The possible options are { user.displayName }.
     * @returns {Promise<object>} User info data.
     * @public
     */
    static async getMe() {
        const response = await Axios.get(
            this.getUrl("me"),
            {
                headers: this.getHeaders()
            }
        );

        return this.handleResponse(response);
    }

    /**
     * Create new Work Log.
     * @param {object} _postData Data to send.
     * @return {Promise<void>} Nothing.
     * @public
     */
    static async createWorkLog(_postData) {
        const response = await Axios.post(
            this.getUrl("workLogs"),
            _postData,
            {
                headers: this.getHeaders()
            }
        );

        return this.handleResponse(response);
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

        const params = {
            $fromTimestamp: `${year}-${month}-${day}T00:00:00`,
            $toTimestamp: `${year}-${month}-${day}T23:59:00`
        };

        const response = await Axios.get(
            this.getUrl("workLogs", params),
            {
                headers: this.getHeaders()
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
            this.getUrl(`workLogs/${_workLogId}`),
            {
                headers: this.getHeaders()
            }
        );

        return this.handleResponse(response);
    }
}

export default TimeTrackerAPI;
export {
    TimeTrackerAPI
};
