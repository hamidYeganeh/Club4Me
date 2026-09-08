import "./setup-env";
import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { getConnectionToken } from "@nestjs/mongoose";
import type { INestApplication } from "@nestjs/common";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Connection, Types } from "mongoose";
import { AppModule } from "../src/app.module";
import { REDIS_CLIENT } from "../src/infrastructure/redis/redis.types";
import { InMemoryRedis } from "../src/infrastructure/redis/in-memory-redis";
import { SMS_PROVIDER } from "../src/modules/auth/providers/sms-provider.interface";
import { CapturingSmsProvider } from "./capturing-sms.provider";
import { TokenService } from "../src/modules/auth/services/token.service";
import { hashPassword } from "../src/common/utils/password.util";

// This executable is outside src/build. It never reads the project's database URL.
if (process.env.CLUB4ME_FULLSTACK_TEST !== "1")
  throw new Error("Explicit acceptance-test mode is required");
let app: INestApplication | undefined;
let mongo: MongoMemoryReplSet | undefined;
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await app?.close();
  await mongo?.stop();
}
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    void close().finally(() => process.exit(0));
  });

async function main() {
  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, args: ["--oplogSize", "16"] },
  });
  process.env.MONGODB_URL = mongo.getUri();
  const applicationPort = Number(
    process.env.CLUB4ME_ACCEPTANCE_APP_PORT ?? 7081,
  );
  if (
    !Number.isInteger(applicationPort) ||
    applicationPort < 1024 ||
    applicationPort > 65535
  )
    throw new Error("CLUB4ME_ACCEPTANCE_APP_PORT is invalid");
  const allowedOrigins = [
    `http://127.0.0.1:${applicationPort}`,
    "http://127.0.0.1:7083",
  ];
  process.env.CORS_ORIGINS = allowedOrigins.join(",");
  const sms = new CapturingSmsProvider();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SMS_PROVIDER)
    .useValue(sms)
    .overrideProvider(REDIS_CLIENT)
    .useValue(new InMemoryRedis())
    .compile();
  app = module.createNestApplication();
  app.useLogger(["error", "warn"]);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  let fixture: Record<string, unknown>;
  app
    .getHttpAdapter()
    .get(
      "/__acceptance/fixture",
      (_req: unknown, res: { json: (body: unknown) => void }) =>
        res.json(fixture),
    );
  app
    .getHttpAdapter()
    .get(
      "/__acceptance/otp",
      (_req: unknown, res: { json: (body: unknown) => void }) =>
        res.json(sms.last ?? null),
    );
  await app.init();
  const db = app.get<Connection>(getConnectionToken());
  await Promise.all(Object.values(db.models).map((model) => model.init()));
  const password = "Acceptance@1405";
  const passwordHash = await hashPassword(password);
  const owner = await db.model("User").create({
    phone: "+989121230001",
    firstName: "مالک",
    lastName: "پذیرش",
    roles: ["owner"],
    status: "active",
    passwordHash,
  });
  const athlete = await db.model("User").create({
    phone: "+989121230002",
    firstName: "سارا",
    lastName: "پذیرش",
    roles: ["athlete"],
    status: "active",
    passwordHash,
  });
  const other = await db.model("User").create({
    phone: "+989121230003",
    firstName: "علی",
    lastName: "دیگر",
    roles: ["athlete"],
    status: "active",
    passwordHash,
  });
  const tokens = (user: any) =>
    app!.get(TokenService).signTokenPair({
      id: String(user._id),
      phone: user.phone,
      roles: user.roles,
    });
  const club = await db.model("Club").create({
    ownerId: owner._id,
    name: "باشگاه پذیرش یکپارچه",
    normalizedName: "باشگاه پذیرش یکپارچه",
    slug: "fullstack-club",
    description: "باشگاه تست موقت برای آزمون مسیر خرید و حضور",
    shortDescription: "پذیرش یکپارچه",
    address: "تهران، خیابان تست، پلاک ۱",
    reviewStatus: "approved",
    visibility: "public",
    operationalStatus: "active",
    timezone: "Asia/Tehran",
  });
  const startsAt = new Date(Date.now() + 24 * 3600000),
    endsAt = new Date(startsAt.getTime() + 3600000);
  const skillLevelId = new Types.ObjectId();
  await db.collection("skill_levels").insertOne({
    _id: skillLevelId,
    code: "INTERMEDIATE",
    slug: "intermediate",
    name: "متوسط",
    normalizedName: "متوسط",
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const session = await db.model("ReservableSession").create({
    clubId: club._id,
    title: "سانس پذیرش یکپارچه",
    startsAt,
    endsAt,
    capacity: 4,
    basePrice: 100000,
    status: "active",
    cancellationPolicy: {
      title: "لغو کامل",
      tiers: [{ hoursBefore: 0, refundPercent: 100 }],
    },
  });
  const product = await db.model("BenefitProduct").create({
    clubId: club._id,
    title: "بسته پذیرش یکپارچه",
    type: "session_pack",
    price: 100000,
    sessionCount: 5,
    validityDays: 30,
    sessionTypes: ["court"],
    weekCalendar: "iran_saturday",
  });
  const clubClass = await db.model("BusinessTrainingClass").create({
    clubId: club._id,
    title: "کلاس باشگاه یکپارچه",
    classModel: "group",
    pricingModel: "package",
    price: 100000,
    capacity: 4,
    packageSessionCount: 8,
    startDate: startsAt,
    endDate: endsAt,
    schedule: [],
    visibility: "public",
    status: "active",
    enrollmentMode: "automatic",
    skillLevelId,
  });
  const coachUser = await db.model("User").create({
    phone: "+989121230004",
    firstName: "مربی",
    lastName: "پذیرش",
    roles: ["coach"],
    status: "active",
    passwordHash,
  });
  const coach = await db.model("Coach").create({
    userId: coachUser._id,
    slug: "fullstack-coach",
    displayName: "مربی پذیرش",
    reviewStatus: "approved",
    visibility: "public",
  });
  const sportId = new Types.ObjectId();
  const offering = await db.model("CoachOffering").create({
    coachId: coach._id,
    sportId,
    title: "جلسه مربی یکپارچه",
    normalizedTitle: "جلسه مربی یکپارچه",
    type: "private",
    deliveryModes: ["online"],
    durationMinutes: 60,
    capacity: 4,
    price: { amount: 100000, currency: "IRR" },
    pricingType: "per_session",
    status: "published",
    cancellationPolicy: { tiers: [{ hoursBefore: 0, refundPercent: 100 }] },
  });
  const packageOffering = await db.model("CoachOffering").create({
    coachId: coach._id,
    sportId,
    title: "بسته مربی یکپارچه",
    normalizedTitle: "بسته مربی یکپارچه",
    type: "private",
    deliveryModes: ["online"],
    durationMinutes: 60,
    capacity: 4,
    price: { amount: 200000, currency: "IRR" },
    pricingType: "package",
    sessionCount: 3,
    status: "published",
    cancellationPolicy: { tiers: [{ hoursBefore: 0, refundPercent: 100 }] },
  });
  const coachSession = await db.model("TrainingSession").create({
    ownerCoachId: coach._id,
    offeringId: offering._id,
    title: "جلسه مربی یکپارچه",
    sportId,
    deliveryMode: "online",
    capacity: 4,
    startAt: startsAt,
    endAt: endsAt,
    status: "open_for_booking",
  });
  const coachRescheduleSession = await db.model("TrainingSession").create({
    ownerCoachId: coach._id,
    offeringId: offering._id,
    title: "جلسه جایگزین مربی یکپارچه",
    sportId,
    deliveryMode: "online",
    capacity: 4,
    startAt: new Date(startsAt.getTime() + 86400000),
    endAt: new Date(endsAt.getTime() + 86400000),
    status: "open_for_booking",
  });
  const course = await db.model("TrainingClass").create({
    ownerCoachId: coach._id,
    sportId,
    title: "دوره مربی یکپارچه",
    normalizedTitle: "دوره مربی یکپارچه",
    slug: "fullstack-course",
    deliveryMode: "online",
    capacity: 4,
    courseStartAt: startsAt,
    courseEndAt: endsAt,
    price: { amount: 100000, currency: "IRR" },
    status: "published",
    enrollmentMode: "automatic",
    skillLevelId,
  });
  fixture = {
    password,
    athlete: {
      id: String(athlete._id),
      phone: "09121230002",
      ...tokens(athlete),
    },
    other: { id: String(other._id), phone: "09121230003", ...tokens(other) },
    owner: { id: String(owner._id), ...tokens(owner) },
    club: { id: String(club._id), slug: club.slug },
    sessionId: String(session._id),
    productId: String(product._id),
    clubClassId: String(clubClass._id),
    coachPackageOfferingId: String(packageOffering._id),
    coachSessionId: String(coachSession._id),
    coachRescheduleSessionId: String(coachRescheduleSession._id),
    coachClassId: String(course._id),
    skillLevelId: String(skillLevelId),
  };
  await app.listen(7088, "127.0.0.1");
  console.log(
    "Acceptance API ready on loopback with an isolated temporary database",
  );
}
void main().catch(async (error) => {
  console.error(error);
  await close();
  process.exit(1);
});
