import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Console transport for production (structured)
  transports.push(
    new winston.transports.Console({
      format: productionFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
      format: productionFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
      format: productionFormat,
    }),
  ],
});

// Create logs directory if it doesn't exist
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// HTTP request logging middleware
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'http.log'),
        maxsize: 5242880,
        maxFiles: 5,
      })
    ] : []),
  ],
});

// Security event logger
export const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'security.log'),
        maxsize: 5242880,
        maxFiles: 10,
      })
    ] : []),
  ],
});

// Performance logger
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'performance.log'),
        maxsize: 5242880,
        maxFiles: 5,
      })
    ] : []),
  ],
});

// Audit logger
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'audit.log'),
        maxsize: 5242880,
        maxFiles: 10,
      })
    ] : []),
  ],
});

// Helper functions for structured logging
export const loggers = {
  // HTTP request logging
  logRequest: (req: any, res: any, responseTime: number) => {
    httpLogger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.userId,
    });
  },

  // Security event logging
  logSecurityEvent: (event: string, details: any, req?: any) => {
    securityLogger.warn('Security Event', {
      event,
      details,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: req?.user?.userId,
    });
  },

  // Performance logging
  logPerformance: (operation: string, duration: number, metadata?: any) => {
    performanceLogger.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      metadata,
    });
  },

  // Database query logging
  logQuery: (query: string, duration: number, params?: any) => {
    if (duration > 1000) { // Log slow queries (>1s)
      performanceLogger.warn('Slow Query', {
        query,
        duration: `${duration}ms`,
        params,
      });
    }
  },

  // Error logging with context
  logError: (error: Error, context?: any, req?: any) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: req?.user?.userId,
      url: req?.url,
      method: req?.method,
    });
  },

  // Business logic logging
  logBusinessEvent: (event: string, data: any, userId?: string) => {
    auditLogger.info('Business Event', {
      event,
      data,
      userId,
    });
  },
};

export { logger };
export default logger;