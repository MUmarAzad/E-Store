/**
 * Logger Utility
 * Structured logging for application monitoring
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow
  info: '\x1b[32m', // Green
  http: '\x1b[35m', // Magenta
  debug: '\x1b[36m', // Cyan
  reset: '\x1b[0m',
};

class Logger {
  constructor(options = {}) {
    this.service = options.service || 'app';
    this.level = LOG_LEVELS[options.level || process.env.LOG_LEVEL || 'info'];
    this.colorize = options.colorize !== false && process.env.NODE_ENV !== 'production';
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      message,
      ...meta,
    };

    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(logEntry);
    }

    // Human-readable format for development
    const colorCode = this.colorize ? COLORS[level] : '';
    const resetCode = this.colorize ? COLORS.reset : '';
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    return `${colorCode}[${timestamp}] [${level.toUpperCase()}] [${this.service}] ${message}${metaString}${resetCode}`;
  }

  /**
   * Check if level should be logged
   * @param {string} level - Log level to check
   * @returns {boolean}
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= this.level;
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object|Error} meta - Additional metadata or Error object
   */
  error(message, meta = {}) {
    if (!this.shouldLog('error')) return;

    if (meta instanceof Error) {
      meta = {
        error: meta.message,
        stack: meta.stack,
        name: meta.name,
      };
    }

    console.error(this.formatMessage('error', message, meta));
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, meta));
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('info', message, meta));
  }

  /**
   * Log HTTP request
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  http(message, meta = {}) {
    if (!this.shouldLog('http')) return;
    console.log(this.formatMessage('http', message, meta));
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message, meta));
  }

  /**
   * Create child logger with additional context
   * @param {Object} context - Additional context for child logger
   * @returns {Object} Child logger methods
   */
  child(context = {}) {
    const parent = this;
    return {
      error: (message, meta = {}) => parent.error(message, { ...context, ...meta }),
      warn: (message, meta = {}) => parent.warn(message, { ...context, ...meta }),
      info: (message, meta = {}) => parent.info(message, { ...context, ...meta }),
      http: (message, meta = {}) => parent.http(message, { ...context, ...meta }),
      debug: (message, meta = {}) => parent.debug(message, { ...context, ...meta }),
    };
  }

  /**
   * Create Express request logging middleware
   * @returns {Function} Express middleware
   */
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const meta = {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
        };

        if (req.user) {
          meta.userId = req.user._id || req.user.id;
        }

        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
        this[level](`${req.method} ${req.originalUrl}`, meta);
      });

      next();
    };
  }
}

/**
 * Create logger instance for a service
 * @param {string} service - Service name
 * @param {Object} options - Logger options
 * @returns {Logger} Logger instance
 */
const createLogger = (service, options = {}) => {
  return new Logger({ service, ...options });
};

// Default logger instance
const logger = new Logger({ service: 'e-store' });

module.exports = {
  Logger,
  createLogger,
  logger,
  LOG_LEVELS,
};
