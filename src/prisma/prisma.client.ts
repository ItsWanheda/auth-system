import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const initializeDatabase = async (): Promise<void> => {
  await prisma.$connect();
  await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;');
};

export default prisma;
