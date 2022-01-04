import DateFNS from "date-fns";
import Axios from "axios";

import Logger from "./Logger.js";

class TimeTrackerAPI {
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
            `https://cegid.timehub.7pace.com/MyTimes/WorkLogsJson?day=${day}&month=${month}&year=${year}`,
            {
                headers: {
                    "accept": "*/*",
                    "client_type": "web",
                    "page_name": "Monthly",
                    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-custom-header": process.env.X_CUSTOM_HEADER,
                    "x-requested-with": "XMLHttpRequest",
                    "cookie": process.env.COOKIE,
                    "Referer": "https://cegid.timehub.7pace.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
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
            "https://cegid.timehub.7pace.com/api-internal/rest/worklogs?api-version=3.1",
            _postData,
            {
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "authorization": `Bearer ${process.env.BEARER_TOKEN}`,
                    "client_type": "web",
                    "content-type": "application/json;charset=UTF-8",
                    "page_name": "Monthly",
                    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "token": process.env.TOKEN,
                    "x-custom-header": process.env.X_CUSTOM_HEADER,
                    "cookie": process.env.COOKIE,
                    "Referer": "https://cegid.timehub.7pace.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
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
