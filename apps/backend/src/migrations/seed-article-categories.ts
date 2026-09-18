import { createHash } from "node:crypto";
import { config as loadDotenv } from "dotenv";
import mongoose from "mongoose";

const categories = [
  { name: "تغذیه", slug: "nutrition", code: "NUTRITION", icon: "apple" },
  { name: "تمرین", icon: "weight", slug: "training", code: "TRAINING" },
  { name: "اخبار", icon: "book-open", slug: "news", code: "NEWS" },
  { name: "سلامت", icon: "heart", slug: "health", code: "HEALTH" },
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
  await mongoose.connection.collection("article_authors").updateOne(
    { code: "GYM4ME_TEAM" },
    {
      $setOnInsert: {
        name: "تیم gym4me",
        code: "GYM4ME_TEAM",
        icon: "users-three",
        isActive: true,
        sortOrder: 0,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  const authors = mongoose.connection.collection("article_authors");
  const articles = mongoose.connection.collection("articles");
  const legacyNames = await articles.distinct("authorName", {
    authorId: { $exists: false },
  });
  for (const value of legacyNames) {
    if (typeof value !== "string" || !value.trim()) continue;
    const name = value.trim();
    const code =
      name === "تیم gym4me"
        ? "GYM4ME_TEAM"
        : `LEGACY_${createHash("sha1").update(name).digest("hex").slice(0, 16).toUpperCase()}`;
    await authors.updateOne(
      { code },
      {
        $setOnInsert: {
          name,
          code,
          isActive: true,
          sortOrder: 0,
          aliases: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    const author = await authors.findOne({ code });
    if (author)
      await articles.updateMany(
        { authorName: value, authorId: { $exists: false } },
        { $set: { authorId: author._id } },
      );
  }
  for (const category of categories) {
    await collection.updateOne(
      { slug: category.slug, icon: { $exists: false } },
      { $set: { icon: category.icon } },
    );
  }
  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
