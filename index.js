import Path from "path";
import {fileURLToPath} from "url";

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

import DotEnv from "dotenv";
import Yargs from "yargs";
import {hideBin} from "yargs/helpers";

import ContextManager from "./src/ContextManager.js";
import Logger from "./src/Logger.js";
import TimeTrackerRunner from "./src/TimeTrackerRunner.js";

// Load .env
DotEnv.config({
    path: `${__dirname}/.env`,
    encoding: "utf8"
});

const context = Yargs(hideBin(process.argv))
    // Help
    .alias("h", "help")
    .describe("help", "Show help")
    // Mandatory options
    .option("start-date", {
        alias: "s",
        description: "Start date",
        type: "string",
        demandOption: true,
        default: process.env.TIME_TRACKER_START_DATE
    })
    .option("end-date", {
        alias: "e",
        description: "End date",
        type: "string",
        demandOption: true,
        default: process.env.TIME_TRACKER_END_DATE
    })
    .option("user-id", {
        alias: "u",
        description: "User ID to whom create work logs",
        type: "string",
        demandOption: true,
        default: process.env.TIME_TRACKER_USER_ID
    })
    // Time tracker options
    .option("time-tracker-bearer-token", {
        description: "Time tracker Bearer token used to create work logs",
        type: "string",
        default: process.env.TIME_TRACKER_BEARER_TOKEN
    })
    .option("time-tracker-cookie", {
        description: "Time tracker Cookie used to create work logs",
        type: "string",
        default: process.env.TIME_TRACKER_COOKIE
    })
    .option("time-tracker-token", {
        description: "Time tracker Token used to create work logs",
        type: "string",
        default: process.env.TIME_TRACKER_TOKEN
    })
    .option("time-tracker-x-custom-header", {
        description: "Time tracker X-CUSTOM-HEADER used to create work logs",
        type: "string",
        default: process.env.TIME_TRACKER_X_CUSTOM_HEADER
    })
    // Optional options
    .option("only-public-days", {
        description: "Create only public days in Time Tracker",
        type: "boolean",
        default: false
    })
    .argv;

// Context
ContextManager.store(context);
// Run Time tracker
TimeTrackerRunner.run();

process.on("unhandledRejection", (_err) => {
    Logger.error(
        _err?.isAxiosError
            ? _err.toJSON()
            : _err
    );
    process.exitCode = 1;

    // Exit gracefully
    process.nextTick(() => {
        process.exit();
    });
});
