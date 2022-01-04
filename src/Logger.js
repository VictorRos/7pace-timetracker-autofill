class Logger {
    static info(...args) {
        // eslint-disable-next-line no-console
        console.info(...args)
    }

    static error(...args) {
        // eslint-disable-next-line no-console
        console.error(...args)
    }
}

export default Logger;
export {
    Logger
};
