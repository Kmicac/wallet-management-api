import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './env.config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format,
  }),
];

// Add file transports only in non-test environments
if (config.node_env !== 'test') {
  transports.push(
    new DailyRotateFile({
      filename: `${config.logging.filePath}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: config.logging.maxFiles,
      maxSize: config.logging.maxSize,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new DailyRotateFile({
      filename: `${config.logging.filePath}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: config.logging.maxFiles,
      maxSize: config.logging.maxSize,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  transports,
  exitOnError: false,
});

logger.on('error', (error) => {
  console.error('Logger error:', error);
});