import { config as loadDotenv } from "dotenv";
import mongoose from "mongoose";

import { slugify } from "../modules/articles/lib/slugify";
import { resourceSeedData } from "../modules/resources/resources.seed-data";

async function seed(): Promise<void> {
  loadDotenv({ path: ".env" });
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is required");

  await mongoose.connect(uri);
  const collection = mongoose.connection.collection("club_tags");
  const now = new Date();

  for (const [sortOrder, tag] of (resourceSeedData.club_tags ?? []).entries()) {
    const name = String(tag.name ?? "").trim();
    const code = String(tag.code ?? "")
      .trim()
      .toUpperCase();
    if (!name || !code) continue;

    await collection.updateOne(
      { code },
      {
        $setOnInsert: {
          name,
          code,
          slug: slugify(name),
          normalizedName: normalizeTagName(name),
          aliases: [],
          isActive: true,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  await mongoose.disconnect();
}

function normalizeTagName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLocaleLowerCase("fa");
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
