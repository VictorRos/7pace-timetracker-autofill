import Path from "path";
import {fileURLToPath} from "url";

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

import DotEnv from "dotenv";

import Logger from "./src/Logger.js";
import TimeTrackerRunner from "./src/TimeTrackerRunner.js";

// Load .env
DotEnv.config({
    path: `${__dirname}/.env`,
    encoding: "utf8"
});

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
