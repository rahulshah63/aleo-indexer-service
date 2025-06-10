// aleo-indexer/src/utils/logger.ts

import { pino } from 'pino';

// Define a simple logger for structured logging
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // Default log level
  transport: {
    target: 'pino-pretty', // Makes logs human-readable in development
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});