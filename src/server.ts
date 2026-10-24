import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initializeDatabase, prisma } from './prisma/prisma.client';

const app = createApp();
let server: ReturnType<typeof app.listen> | undefined;

const start = async (): Promise<void> => {
  await initializeDatabase();
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 ${env.APP_NAME} listening on ${env.APP_URL}`);
    logger.info(`📚 Docs available at ${env.APP_URL}/api/docs`);
  });
};

void start().catch(async (err: unknown) => {
  logger.fatal({ err }, 'Application startup failed');
  await prisma.$disconnect().catch((disconnectError: unknown) => {
    logger.error({ err: disconnectError }, 'Failed to disconnect Prisma after startup failure');
  });
  process.exit(1);
});

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
    return;
  }

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('HTTP server closed and DB disconnected');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forcing shutdown after 10s timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  void shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
});
