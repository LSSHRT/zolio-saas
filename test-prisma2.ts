import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log("Fetching clients...");
  const clients = await prisma.client.findMany();
  console.log(clients);
}
main().catch(console.error).finally(() => prisma.$disconnect());