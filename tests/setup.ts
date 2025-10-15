import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env.test') });

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  debug: console.debug,
};

global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.log,
};

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});