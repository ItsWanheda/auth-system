import { logger } from '../config/logger';

export const requestLogger = {
  info: (msg: string, meta?: Record<string, unknown>): void => logger.info(meta ?? {}, msg),
  warn: (msg: string, meta?: Record<string, unknown>): void => logger.warn(meta ?? {}, msg),
  error: (msg: string, meta?: Record<string, unknown>): void => logger.error(meta ?? {}, msg),
  debug: (msg: string, meta?: Record<string, unknown>): void => logger.debug(meta ?? {}, msg),
};