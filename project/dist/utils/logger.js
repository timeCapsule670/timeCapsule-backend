"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = exports.logError = exports.logWarn = exports.logInfo = exports.logDebug = exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || LogLevel.INFO;
    }
    /**
     * Logs a message with the specified level
     */
    log(level, message, metadata) {
        if (this.shouldLog(level)) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                metadata
            };
            this.outputLog(logEntry);
        }
    }
    /**
     * Determines if a log level should be output
     */
    shouldLog(level) {
        const levels = Object.values(LogLevel);
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    /**
     * Outputs the log entry
     */
    outputLog(logEntry) {
        const timestamp = logEntry.timestamp;
        const level = logEntry.level.toUpperCase().padEnd(5);
        const message = logEntry.message;
        const metadata = logEntry.metadata ? ` | ${JSON.stringify(logEntry.metadata)}` : '';
        console.log(`[${timestamp}] ${level} | ${message}${metadata}`);
    }
    /**
     * Logs debug information
     */
    debug(message, metadata) {
        this.log(LogLevel.DEBUG, message, metadata);
    }
    /**
     * Logs informational messages
     */
    info(message, metadata) {
        this.log(LogLevel.INFO, message, metadata);
    }
    /**
     * Logs warning messages
     */
    warn(message, metadata) {
        this.log(LogLevel.WARN, message, metadata);
    }
    /**
     * Logs error messages
     */
    error(message, error, metadata) {
        const logMetadata = {
            ...metadata,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        };
        this.log(LogLevel.ERROR, message, logMetadata);
    }
    /**
     * Creates an audit log entry for tracking user actions
     */
    audit(action, resource, userId, outcome, resourceId, changes, metadata) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `AUDIT: ${action} on ${resource}`,
            action,
            resource,
            resourceId,
            userId,
            changes,
            outcome,
            metadata
        };
        this.outputLog(auditEntry);
    }
    /**
     * Logs child profile creation events
     */
    logChildProfileCreation(userId, childrenCount, outcome, error, metadata) {
        const message = `Child profile creation: ${childrenCount} children, outcome: ${outcome}`;
        if (outcome === 'success') {
            this.info(message, { userId, childrenCount, ...metadata });
        }
        else if (outcome === 'partial') {
            this.warn(message, { userId, childrenCount, ...metadata });
        }
        else {
            this.error(message, error, { userId, childrenCount, ...metadata });
        }
        // Create audit log
        this.audit('create', 'child_profiles', userId, outcome, undefined, { childrenCount }, metadata);
    }
    /**
     * Logs validation failures
     */
    logValidationFailure(userId, resource, errors, metadata) {
        this.warn(`Validation failed for ${resource}`, {
            userId,
            resource,
            errors,
            ...metadata
        });
    }
    /**
     * Logs database operation events
     */
    logDatabaseOperation(operation, table, userId, outcome, error, metadata) {
        const message = `Database ${operation} on ${table}`;
        if (outcome === 'success') {
            this.debug(message, { userId, table, operation, ...metadata });
        }
        else {
            this.error(message, error, { userId, table, operation, ...metadata });
        }
    }
    /**
     * Logs performance metrics
     */
    logPerformance(operation, duration, userId, metadata) {
        this.info(`Performance: ${operation} took ${duration}ms`, {
            operation,
            duration,
            userId,
            ...metadata
        });
    }
    /**
     * Logs security events
     */
    logSecurityEvent(event, userId, ip, userAgent, metadata) {
        this.warn(`Security: ${event}`, {
            event,
            userId,
            ip,
            userAgent,
            ...metadata
        });
    }
    /**
     * Extracts request information for logging
     */
    extractRequestInfo(req) {
        return {
            method: req.method,
            url: req.url,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            requestId: req.headers['x-request-id'] || req.headers['x-correlation-id']
        };
    }
}
// Export singleton instance
exports.logger = new Logger();
// Export convenience functions
const logDebug = (message, metadata) => exports.logger.debug(message, metadata);
exports.logDebug = logDebug;
const logInfo = (message, metadata) => exports.logger.info(message, metadata);
exports.logInfo = logInfo;
const logWarn = (message, metadata) => exports.logger.warn(message, metadata);
exports.logWarn = logWarn;
const logError = (message, error, metadata) => exports.logger.error(message, error, metadata);
exports.logError = logError;
const logAudit = (action, resource, userId, outcome, resourceId, changes, metadata) => exports.logger.audit(action, resource, userId, outcome, resourceId, changes, metadata);
exports.logAudit = logAudit;
