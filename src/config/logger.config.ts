import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './env.config';

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

const transports = [
  new winston.transports.Console(),
  new DailyRotateFile({
    filename: `${env.logging.filePath}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: env.logging.maxFiles,
    maxSize: env.logging.maxSize,
  }),
  new DailyRotateFile({
    filename: `${env.logging.filePath}/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxFiles: env.logging.maxFiles,
    maxSize: env.logging.maxSize,
  }),
];

export const logger = winston.createLogger({
  level: env.logging.level,
  levels,
  format,
  transports,
});