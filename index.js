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
    // Time tracker options
    .option("time-tracker-api-token", {
        alias: "t",
        description: "Time tracker API token used to create work logs",
        type: "string",
        default: process.env.TIME_TRACKER_API_TOKEN
    })
    // Optional options
    .option("only-public-days", {
        description: "Create only public days in Time Tracker",
        type: "boolean",
        default: false
    })
    .option("force", {
        alias: "f",
        description: "Override existing work logs except days off",
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
