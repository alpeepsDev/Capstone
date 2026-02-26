import prisma from "../server/src/config/database.js";
import { encrypt, decrypt } from "../server/src/utils/encryption.js";

// Mock user for testing (ensure this ID exists or use a dummy that bypasses controller logic if testing utils directly,
// but here we are testing the full flow if possible, or just the data layer)

// Since I cannot easily invoke the controller without a server, I will test the data layer transformation
// that matches what the controller does.

async function verifyEncryption() {
  console.log("--- Starting Encryption Verification ---");

  const testProjectName = "Simulated Verification Project";
  const testProjectDesc = "This is a secret description";

  console.log(`Original Name: ${testProjectName}`);
  console.log(`Original Desc: ${testProjectDesc}`);

  // 1. Simulate Controller Encryption (what happens before prisma.create)
  const encryptedName = encrypt(testProjectName);
  const encryptedDesc = encrypt(testProjectDesc);

  console.log(`Encrypted Name: ${encryptedName}`);
  console.log(`Encrypted Desc: ${encryptedDesc}`);

  if (encryptedName === testProjectName) {
    console.error("❌ Encryption failed: Name is unchanged");
    return;
  }

  // 2. Simulate Decryption (that happens after prisma.find)
  const decryptedName = decrypt(encryptedName);
  const decryptedDesc = decrypt(encryptedDesc);

  console.log(`Decrypted Name: ${decryptedName}`);
  console.log(`Decrypted Desc: ${decryptedDesc}`);

  if (decryptedName === testProjectName && decryptedDesc === testProjectDesc) {
    console.log("✅ Encryption/Decryption Utility Works Correctly");
  } else {
    console.error("❌ Decryption mismatch");
  }

  console.log("--- Database Interaction Verification ---");
  // We can try to actually create a project if we have a valid user ID,
  // but without a known valid Manager ID, we might fail foreign key constraints.
  // I will check for an existing user first.

  try {
    const user = await prisma.user.findFirst({ where: { role: "MANAGER" } });
    if (!user) {
      console.log("⚠️ No Manager user found. Skipping DB insertion test.");
      return;
    }

    console.log(`Found Manager: ${user.username} (${user.id})`);

    // Create Project with ENCRYPTED data (as the controller would)
    const project = await prisma.project.create({
      data: {
        name: encrypt(testProjectName),
        description: encrypt(testProjectDesc),
        managerId: user.id,
      },
    });
    console.log(`Created Project ID: ${project.id}`);
    console.log(`DB Stored Name (Raw): ${project.name}`); // Should be encrypted in DB object return

    // Verify it looks encrypted
    if (project.name === testProjectName) {
      console.error("❌ DB Insertion failed: Data stored as plain text");
    } else {
      console.log("✅ DB Insertion appears encrypted");
    }

    // Read back and decrypt
    const fetchedProject = await prisma.project.findUnique({
      where: { id: project.id },
    });
    const finalName = decrypt(fetchedProject.name);
    const finalDesc = decrypt(fetchedProject.description);

    if (finalName === testProjectName) {
      console.log("✅ Round-trip DB encryption/decryption successful");
    } else {
      console.error(`❌ Round-trip failed. Got: ${finalName}`);
    }

    // Cleanup
    await prisma.project.delete({ where: { id: project.id } });
    console.log("Cleaned up test project.");
  } catch (err) {
    console.error("DB Test Error:", err);
  }
}

verifyEncryption()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
