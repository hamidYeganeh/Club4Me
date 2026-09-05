import { config as loadDotenv } from "dotenv";
import mongoose from "mongoose";

import { DEFAULT_DISCOVERY_SECTIONS } from "../modules/discovery/discovery-section.defaults";

async function seed(): Promise<void> {
  loadDotenv({ path: ".env" });
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is required");

  await mongoose.connect(uri);
  const collection = mongoose.connection.collection("discovery_sections");
  const now = new Date();

  const result = await collection.bulkWrite(
    DEFAULT_DISCOVERY_SECTIONS.map((section) => ({
      updateOne: {
        filter: { key: section.key },
        update: {
          $setOnInsert: { ...section, createdAt: now, updatedAt: now },
        },
        upsert: true,
      },
    })),
  );

  console.log(
    `Discovery seed complete: ${result.upsertedCount} created, ${DEFAULT_DISCOVERY_SECTIONS.length - result.upsertedCount} already existed.`,
  );
  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
