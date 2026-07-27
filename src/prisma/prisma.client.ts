import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function applySqlitePragmas() {
  try {
    await prisma.$queryRawUnsafe(`PRAGMA journal_mode=WAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys=ON;`);

    console.log("SQLite PRAGMAs applied");
  } catch (error) {
    console.error("Failed to apply SQLite PRAGMAs", error);
  }
}

prisma.$connect()
  .then(async () => {
    console.log("Database connected");

    await applySqlitePragmas();
  });

export default prisma;