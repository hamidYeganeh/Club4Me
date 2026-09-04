import { config as loadDotenv } from "dotenv";
import mongoose from "mongoose";

const sections = [
  {
    key: "featured-banners",
    type: "banners",
    title: "پیشنهادهای ویژه",
    subtitle: "فرصت‌های تازه برای شروع حرکت",
    layout: "16/9:1",
    viewAllLabel: "",
    viewAllUrl: "",
    enabled: true,
    position: 0,
    selection: {
      mode: "query",
      itemIds: [],
      limit: 10,
      sort: "newest",
      filters: {},
    },
    banners: [
      {
        title: "باشگاه مناسب خودت را پیدا کن",
        subtitle: "بهترین باشگاه‌ها و مربی‌ها، یک‌جا و نزدیک تو",
        imageUrl:
          "https://images.unsplash.com/photo-1534438327276-14e7789c4591?auto=format&fit=crop&w=1400&q=85",
        actionLabel: "شروع جست‌وجو",
        actionUrl: "/discovery/search",
      },
      {
        title: "با مربی حرفه‌ای تمرین کن",
        subtitle: "مربی مناسب هدفت را انتخاب کن",
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1400&q=85",
        actionLabel: "مشاهده مربی‌ها",
        actionUrl: "/discovery/coaches",
      },
    ],
  },
  {
    key: "top-rated-clubs",
    type: "clubs",
    title: "باشگاه‌های محبوب",
    subtitle: "انتخاب کاربران جیم‌فورمی",
    layout: "carousel",
    viewAllLabel: "مشاهده همه",
    viewAllUrl: "/discovery/clubs",
    enabled: true,
    position: 1,
    selection: {
      mode: "query",
      itemIds: [],
      limit: 8,
      sort: "rating",
      filters: {},
    },
    banners: [],
  },
  {
    key: "featured-coaches",
    type: "coaches",
    title: "مربی‌های منتخب",
    subtitle: "کنار حرفه‌ای‌ها به هدفت برس",
    layout: "carousel",
    viewAllLabel: "مشاهده همه",
    viewAllUrl: "/discovery/coaches",
    enabled: true,
    position: 2,
    selection: {
      mode: "query",
      itemIds: [],
      limit: 8,
      sort: "rating",
      filters: {},
    },
    banners: [],
  },
  {
    key: "latest-articles",
    type: "articles",
    title: "تازه‌های مجله",
    subtitle: "تمرین بهتر، تغذیه سالم‌تر و زندگی فعال‌تر",
    layout: "carousel",
    viewAllLabel: "مشاهده همه",
    viewAllUrl: "/articles",
    enabled: true,
    position: 3,
    selection: {
      mode: "query",
      itemIds: [],
      limit: 8,
      sort: "newest",
      filters: {},
    },
    banners: [],
  },
] as const;

async function seed(): Promise<void> {
  loadDotenv({ path: ".env" });
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is required");

  await mongoose.connect(uri);
  const collection = mongoose.connection.collection("discovery_sections");
  const now = new Date();

  const result = await collection.bulkWrite(
    sections.map((section) => ({
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
    `Discovery seed complete: ${result.upsertedCount} created, ${sections.length - result.upsertedCount} already existed.`,
  );
  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
