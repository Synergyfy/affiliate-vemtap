import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking API keys in the vemtap_affiliate database...");
  
  const keys = await prisma.apiKey.findMany();
  console.log("Existing API keys in database:", keys.length);
  for (const k of keys) {
    console.log(`- [${k.id}] Name: "${k.name}" Prefix: "${k.prefix}" Active: ${k.isActive}`);
  }

  const targetRawKey = "vem_3774d66ba1ac7392c877d121bb3c919b65df2c9d11b66555f2e4efe6";
  const targetPrefix = "vem_3774d66b";
  
  const hasKey = keys.find(k => k.prefix === targetPrefix);
  if (hasKey) {
    console.log(`\nKey with prefix ${targetPrefix} already exists in database.`);
    if (!hasKey.isActive) {
      await prisma.apiKey.update({
        where: { id: hasKey.id },
        data: { isActive: true }
      });
      console.log("Updated key status to ACTIVE.");
    }
  } else {
    console.log(`\nKey with prefix ${targetPrefix} NOT found in database. Creating it...`);
    
    // Find first admin or create one
    let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      console.log("No admin user found. Creating admin@vemtap.com...");
      const hashedPassword = await bcrypt.hash("VemtapAdminPassword2026!", 10);
      admin = await prisma.user.create({
        data: {
          email: "admin@vemtap.com",
          fullName: "Vemtap System Admin",
          phone: "0000000000",
          password: hashedPassword,
          role: "ADMIN",
          referralCode: "ADMIN_SYSTEM",
        }
      });
    }
    
    const keyHash = await bcrypt.hash(targetRawKey, 10);
    const createdKey = await prisma.apiKey.create({
      data: {
        name: "Development Integration Key",
        prefix: targetPrefix,
        keyHash,
        createdById: admin.id,
        isActive: true
      }
    });
    console.log(`Created key with ID: ${createdKey.id} and Prefix: ${createdKey.prefix}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
