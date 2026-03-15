const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const clients = await prisma.client.findMany({ take: 1 });
    console.log("DB connection successful. Clients count:", clients.length);
  } catch (error) {
    console.error("DB connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
