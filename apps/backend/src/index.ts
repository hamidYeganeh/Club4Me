import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { connectMongo } from "./db/mongodb.js";
import { connectRedis } from "./db/redis.js";
import { ensureDiscoveryIndexes } from "./services/discovery.js";
import { ensureUserIndexes } from "./services/users.js";

const env = loadEnv();
const app = createApp(env);

async function bootstrap() {
  await connectMongo(env);
  const redis = connectRedis(env);
  await redis.connect();
  await ensureUserIndexes();
  await ensureDiscoveryIndexes();

  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`Backend running on http://localhost:${info.port}`);
    },
  );
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
