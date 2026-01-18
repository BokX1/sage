import pino from 'pino';
import { config } from '../core/config/env';

export const logger = pino({
  level: config.logLevel,
});
