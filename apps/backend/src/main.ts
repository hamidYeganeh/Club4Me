import "reflect-metadata";
import { config as loadDotenv } from "dotenv";
import { Logger } from "@nestjs/common";

import { createConfiguredApp } from "./bootstrap";

loadDotenv({ path: ".env" });

async function bootstrap() {
  const app = await createConfiguredApp();
  const port = Number(process.env.PORT ?? 7088);

  await app.listen(port);
  Logger.log(`Backend running on http://localhost:${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
