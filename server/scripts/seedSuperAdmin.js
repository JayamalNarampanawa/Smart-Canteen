import bcrypt from "bcryptjs";
import { connectDb } from "../src/config/db.js";
import { env, validateEnv } from "../src/config/env.js";
import { User } from "../src/models/User.js";
import { ROLES } from "../src/constants/roles.js";

const SUPER_ADMIN_EMAIL = "admin@nimbsomething.com";
const SUPER_ADMIN_PASSWORD = "Admin@12345";

async function seed() {
  validateEnv();
  await connectDb(env.mongoUri);

  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log("Super admin already exists");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  await User.create({
    name: "NIBM Super Admin",
    email: SUPER_ADMIN_EMAIL,
    passwordHash,
    role: ROLES.SUPER_ADMIN
  });

  // eslint-disable-next-line no-console
  console.log("Seeded super admin:");
  // eslint-disable-next-line no-console
  console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
  // eslint-disable-next-line no-console
  console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
  process.exit(0);
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error.message);
  process.exit(1);
});

