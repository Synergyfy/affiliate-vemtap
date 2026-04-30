import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@vemtap.com";
  const password = "VemtapAdminPassword2026!";
  const name = "Vemtap System Admin";
  const phone = "0000000000";

  console.log(`Creating admin account for ${email}...`);

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create or update the Admin User
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: {
      email,
      fullName: name,
      phone,
      password: hashedPassword,
      role: Role.ADMIN,
      referralCode: "ADMIN_SYSTEM",
    },
  });

  console.log(`Admin user created: ${admin.id}`);

  // 2. Generate an API Key for this admin
  const prefixId = crypto.randomBytes(4).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");
  const rawKey = `vem_${prefixId}${secret}`;
  const prefix = `vem_${prefixId}`;
  const keyHash = await bcrypt.hash(rawKey, 10);

  const apiKey = await prisma.apiKey.create({
    data: {
      name: "System Integration Key",
      keyHash,
      prefix,
      createdById: admin.id,
    },
  });

  console.log("\n--- ADMIN CREDENTIALS ---");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log("\n--- GENERATED API KEY ---");
  console.log(`Key Name: ${apiKey.name}`);
  console.log(`Raw Key:  ${rawKey}`);
  console.log("--- STORE THIS SECURELY ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
