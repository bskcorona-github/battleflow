import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.argv[2];

  if (!adminEmail) {
    console.error("Please provide an email address");
    process.exit(1);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        email: adminEmail,
      },
      data: {
        isAdmin: true,
      },
    });

    console.log(`User ${updatedUser.email} is now an admin`);
  } catch (error) {
    console.error("Error updating user:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
