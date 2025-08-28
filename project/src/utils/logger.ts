import { Request } from 'express';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  error?: Error;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogEntry extends LogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  changes?: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial';
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  /**
   * Logs a message with the specified level
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(level)) {
      const logEntry: LogEntry = {
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
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Outputs the log entry
   */
  private outputLog(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp;
    const level = logEntry.level.toUpperCase().padEnd(5);
    const message = logEntry.message;
    const metadata = logEntry.metadata ? ` | ${JSON.stringify(logEntry.metadata)}` : '';

    console.log(`[${timestamp}] ${level} | ${message}${metadata}`);
  }

  /**
   * Logs debug information
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Logs informational messages
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Logs warning messages
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Logs error messages
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
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
  audit(
    action: string,
    resource: string,
    userId: string,
    outcome: 'success' | 'failure' | 'partial',
    resourceId?: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>
  ): void {
    const auditEntry: AuditLogEntry = {
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
  logChildProfileCreation(
    userId: string,
    childrenCount: number,
    outcome: 'success' | 'failure' | 'partial',
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const message = `Child profile creation: ${childrenCount} children, outcome: ${outcome}`;
    
    if (outcome === 'success') {
      this.info(message, { userId, childrenCount, ...metadata });
    } else if (outcome === 'partial') {
      this.warn(message, { userId, childrenCount, ...metadata });
    } else {
      this.error(message, error, { userId, childrenCount, ...metadata });
    }

    // Create audit log
    this.audit(
      'create',
      'child_profiles',
      userId,
      outcome,
      undefined,
      { childrenCount },
      metadata
    );
  }

  /**
   * Logs validation failures
   */
  logValidationFailure(
    userId: string,
    resource: string,
    errors: string[],
    metadata?: Record<string, any>
  ): void {
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
  logDatabaseOperation(
    operation: string,
    table: string,
    userId: string,
    outcome: 'success' | 'failure',
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const message = `Database ${operation} on ${table}`;
    
    if (outcome === 'success') {
      this.debug(message, { userId, table, operation, ...metadata });
    } else {
      this.error(message, error, { userId, table, operation, ...metadata });
    }
  }

  /**
   * Logs performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
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
  logSecurityEvent(
    event: string,
    userId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): void {
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
  extractRequestInfo(req: Request): Record<string, any> {
    return {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      requestId: req.headers['x-request-id'] || req.headers['x-correlation-id']
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, metadata?: Record<string, any>) => logger.debug(message, metadata);
export const logInfo = (message: string, metadata?: Record<string, any>) => logger.info(message, metadata);
export const logWarn = (message: string, metadata?: Record<string, any>) => logger.warn(message, metadata);
export const logError = (message: string, error?: Error, metadata?: Record<string, any>) => logger.error(message, error, metadata);
export const logAudit = (
  action: string,
  resource: string,
  userId: string,
  outcome: 'success' | 'failure' | 'partial',
  resourceId?: string,
  changes?: Record<string, any>,
  metadata?: Record<string, any>
) => logger.audit(action, resource, userId, outcome, resourceId, changes, metadata);
