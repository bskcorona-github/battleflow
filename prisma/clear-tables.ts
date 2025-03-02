import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function clearTables() {
  try {
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
    await prisma.$executeRaw`TRUNCATE TABLE mc_rank;`;
    await prisma.$executeRaw`TRUNCATE TABLE MC;`;
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
    console.log("Tables cleared successfully");
  } catch (error) {
    console.error("Error clearing tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTables();
