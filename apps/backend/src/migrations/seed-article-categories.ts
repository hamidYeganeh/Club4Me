import { config as loadDotenv } from "dotenv";
import mongoose from "mongoose";

const categories = [
  { name: "تغذیه", slug: "nutrition", code: "NUTRITION" },
  { name: "تمرین", slug: "training", code: "TRAINING" },
  { name: "اخبار", slug: "news", code: "NEWS" },
  { name: "سلامت", slug: "health", code: "HEALTH" },
] as const;

async function seed(): Promise<void> {
  loadDotenv({ path: ".env" });
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is required");
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection("article_categories");
  for (const category of categories) {
    await collection.updateOne(
      { slug: category.slug },
      {
        $setOnInsert: {
          ...category,
          normalizedName: category.name,
          isActive: true,
          sortOrder: 0,
          aliases: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
