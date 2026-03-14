import { prisma } from "./src/lib/prisma";
async function run() {
  try {
    const client = await prisma.client.create({
      data: { userId: "test_user", nom: "Test Client", email: "test@example.com", telephone: "", adresse: "" }
    });
    console.log("Success:", client);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
