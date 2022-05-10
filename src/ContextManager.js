let context = null;

class ContextManager {
    /**
     * Store context.
     * @param {object} _context Context.
     * @return {void} Nothing.
     */
    static store(_context) {
        context = _context;
    }

    /**
     * Get context.
     * @return {object} Context.
     */
    static get() {
        return context;
    }
}

export default ContextManager;
export {
    ContextManager
};
