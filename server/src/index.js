import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";

async function start() {
  validateEnv();
  await connectDb(env.mongoUri);
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${env.port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

