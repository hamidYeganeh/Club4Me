import { config as loadDotenv } from "dotenv";
import mongoose, { Types } from "mongoose";

import { hashPassword } from "../common/utils/password.util";

const id = (value: string) => new Types.ObjectId(value);
const ids = {
  athlete: id("66d100000000000000000001"),
  attendee: id("66d100000000000000000002"),
  coachUser: id("66d100000000000000000003"),
  owner: id("66d100000000000000000004"),
  admin: id("66d100000000000000000005"),
  country: id("66d200000000000000000001"),
  province: id("66d200000000000000000002"),
  city: id("66d200000000000000000003"),
  district: id("66d200000000000000000004"),
  region: id("66d200000000000000000005"),
  sportCategory: id("66d200000000000000000006"),
  sport: id("66d200000000000000000007"),
  clubType: id("66d200000000000000000008"),
  amenity: id("66d200000000000000000009"),
  equipment: id("66d20000000000000000000a"),
  clubMedia: id("66d300000000000000000001"),
  coachMedia: id("66d300000000000000000002"),
  classMedia: id("66d300000000000000000003"),
  club: id("66d400000000000000000001"),
  membership: id("66d400000000000000000002"),
  coach: id("66d500000000000000000001"),
  coachSport: id("66d500000000000000000002"),
  offering: id("66d500000000000000000003"),
  trainingClass: id("66d500000000000000000004"),
  classSession: id("66d500000000000000000005"),
  directSession: id("66d500000000000000000006"),
  attendeeEnrollment: id("66d500000000000000000007"),
  court: id("66d600000000000000000001"),
  clubSession: id("66d600000000000000000002"),
  completedSession: id("66d600000000000000000003"),
  completedReservation: id("66d600000000000000000004"),
  review: id("66d600000000000000000005"),
};

const LOCAL_DEMO_PASSWORD = "Demo@1405";

function addDays(value: Date, days: number, hour: number, minute = 0) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  result.setHours(hour, minute, 0, 0);
  return result;
}

async function upsert(
  collection: string,
  documentId: Types.ObjectId,
  value: Record<string, unknown>,
  now: Date,
) {
  await mongoose.connection.collection(collection).updateOne(
    { _id: documentId },
    {
      $set: { ...value, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

async function seed(): Promise<void> {
  loadDotenv({ path: ".env" });
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is required");
  const demoPassword =
    process.env.SEED_DEMO_PASSWORD?.trim() || LOCAL_DEMO_PASSWORD;
  if (
    process.env.NODE_ENV === "production" &&
    demoPassword === LOCAL_DEMO_PASSWORD
  ) {
    throw new Error("SEED_DEMO_PASSWORD is required in production");
  }

  await mongoose.connect(uri);
  const now = new Date();
  const passwordHash = await hashPassword(demoPassword);

  const users = [
    {
      _id: ids.athlete,
      phone: "+989120000001",
      firstName: "آرمان",
      lastName: "ورزشکار",
      roles: ["athlete"],
    },
    {
      _id: ids.attendee,
      phone: "+989120000002",
      firstName: "سارا",
      lastName: "احمدی",
      roles: ["athlete"],
    },
    {
      _id: ids.coachUser,
      phone: "+989120000003",
      firstName: "رضا",
      lastName: "مرادی",
      roles: ["athlete", "coach"],
    },
    {
      _id: ids.owner,
      phone: "+989120000004",
      firstName: "مینا",
      lastName: "مدیر",
      roles: ["athlete", "owner"],
    },
    {
      _id: ids.admin,
      phone: "+989120000005",
      firstName: "مدیر",
      lastName: "سامانه",
      roles: ["admin"],
    },
  ] as const;
  for (const user of users) {
    await upsert(
      "users",
      user._id,
      {
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [...user.roles],
        passwordHash,
        status: "active",
      },
      now,
    );
  }

  const resourceBase = { isActive: true, sortOrder: 0 };
  await upsert(
    "countries",
    ids.country,
    { ...resourceBase, name: "ایران", normalizedName: "ایران", code: "IR" },
    now,
  );
  await upsert(
    "provinces",
    ids.province,
    {
      ...resourceBase,
      name: "تهران",
      normalizedName: "تهران",
      code: "TEHRAN",
      countryId: ids.country,
    },
    now,
  );
  await upsert(
    "cities",
    ids.city,
    {
      ...resourceBase,
      name: "تهران",
      normalizedName: "تهران",
      code: "TEHRAN_CITY",
      provinceId: ids.province,
    },
    now,
  );
  await upsert(
    "districts",
    ids.district,
    {
      ...resourceBase,
      name: "منطقه ۲",
      normalizedName: "منطقه ۲",
      code: "TEHRAN_DISTRICT_2",
      cityId: ids.city,
    },
    now,
  );
  await upsert(
    "city_regions",
    ids.region,
    {
      ...resourceBase,
      name: "غرب تهران",
      normalizedName: "غرب تهران",
      code: "TEHRAN_WEST",
      cityId: ids.city,
    },
    now,
  );
  await upsert(
    "sport_categories",
    ids.sportCategory,
    {
      ...resourceBase,
      name: "تناسب اندام",
      normalizedName: "تناسب اندام",
      code: "FITNESS_DEMO",
    },
    now,
  );
  await upsert(
    "sports",
    ids.sport,
    {
      ...resourceBase,
      name: "فیتنس",
      normalizedName: "فیتنس",
      code: "FITNESS_DEMO",
      categoryId: ids.sportCategory,
    },
    now,
  );
  await upsert(
    "club_types",
    ids.clubType,
    {
      ...resourceBase,
      name: "باشگاه بدنسازی",
      normalizedName: "باشگاه بدنسازی",
      code: "GYM_DEMO",
    },
    now,
  );
  await upsert(
    "amenities",
    ids.amenity,
    {
      ...resourceBase,
      name: "دوش و رختکن",
      normalizedName: "دوش و رختکن",
      code: "SHOWER_DEMO",
      icon: "shower",
      description: "رختکن تمیز و دوش آب گرم",
    },
    now,
  );
  await upsert(
    "equipment",
    ids.equipment,
    {
      ...resourceBase,
      name: "دمبل حرفه‌ای",
      normalizedName: "دمبل حرفه‌ای",
      code: "DUMBBELL_DEMO",
      icon: "dumbbell",
      sportIds: [ids.sport],
      description: "ست کامل دمبل برای تمرین قدرتی",
    },
    now,
  );

  await upsert(
    "media",
    ids.clubMedia,
    {
      ownerId: ids.owner,
      url: "https://images.unsplash.com/photo-1534438327276-14e7789c4591?auto=format&fit=crop&w=1400&q=85",
      mimeType: "image/jpeg",
      status: "ready",
    },
    now,
  );
  await upsert(
    "media",
    ids.coachMedia,
    {
      ownerId: ids.coachUser,
      url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=85",
      mimeType: "image/jpeg",
      status: "ready",
    },
    now,
  );
  await upsert(
    "media",
    ids.classMedia,
    {
      ownerId: ids.coachUser,
      url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
      mimeType: "image/jpeg",
      status: "ready",
    },
    now,
  );

  const cancellationPolicy = {
    _id: new Types.ObjectId("66d400000000000000000010"),
    title: "لغو منعطف",
    version: 1,
    priority: 1,
    sessionTypes: ["court", "class", "coached_session"],
    daysOfWeek: [],
    courtIds: [],
    reservationCutoffMinutes: 30,
    rescheduleCutoffMinutes: 120,
    noShowRefundPercent: 0,
    ownerCancellationRefundPercent: 100,
    isActive: true,
    tiers: [
      { hoursBefore: 24, refundPercent: 100 },
      { hoursBefore: 6, refundPercent: 50 },
      { hoursBefore: 0, refundPercent: 0 },
    ],
  };
  await upsert(
    "clubs",
    ids.club,
    {
      ownerId: ids.owner,
      name: "باشگاه انرژی پلاس",
      normalizedName: "باشگاه انرژی پلاس",
      slug: "energy-plus-demo",
      shortDescription: "تمرین حرفه‌ای در قلب غرب تهران",
      description:
        "یک باشگاه مجهز و خوش‌مسیر برای تمرین‌های قدرتی و گروهی، با مربی‌های تأییدشده و امکان رزرو آنلاین سانس.",
      gallery: [
        {
          mediaId: ids.clubMedia,
          title: "سالن اصلی",
          altText: "نمای سالن باشگاه انرژی پلاس",
          kind: "image",
          position: 0,
          isCover: true,
        },
      ],
      coverMediaId: ids.clubMedia,
      equipment: [
        {
          resourceId: ids.equipment,
          quantity: 20,
          reservableQuantity: 4,
          status: "available",
          description: "وزنه‌های متنوع برای همه سطوح",
        },
      ],
      amenities: [
        {
          resourceId: ids.amenity,
          quantity: 6,
          availability: "included",
          description: "استفاده برای اعضا رایگان است",
        },
      ],
      rules: ["همراه داشتن کفش ورزشی الزامی است."],
      geo: {
        countryId: ids.country,
        provinceId: ids.province,
        cityId: ids.city,
        districtId: ids.district,
        cityRegionIds: [ids.region],
      },
      address: "تهران، سعادت‌آباد، بلوار دریا",
      location: { type: "Point", coordinates: [51.378, 35.778] },
      postalCode: "1999999999",
      timezone: "Asia/Tehran",
      locationNotes: "ورودی باشگاه کنار پارکینگ عمومی است.",
      socialMedia: [{ platform: "instagram", link: "gym4me_demo" }],
      clubTypeIds: [ids.clubType],
      sportIds: [ids.sport],
      tags: ["دمو", "فیتنس", "بدنسازی"],
      cancellationRules: [cancellationPolicy],
      weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        periods: [{ opensAt: "07:00", closesAt: "23:00" }],
        isClosed: dayOfWeek === 5,
      })),
      closures: [],
      audience: ["mixed"],
      currency: "IRR",
      taxPercent: 0,
      averageRating: 5,
      reviewsCount: 1,
      operationalStatus: "active",
      reviewStatus: "approved",
      visibility: "public",
      rejectionReason: null,
      publishedAt: now,
      schemaVersion: 2,
      createdBy: ids.owner,
      updatedBy: ids.owner,
    },
    now,
  );
  await upsert(
    "club_memberships",
    ids.membership,
    {
      clubId: ids.club,
      userId: ids.owner,
      role: "owner",
      permissions: ["*"],
      status: "accepted",
      invitedBy: ids.owner,
      acceptedAt: now,
    },
    now,
  );

  await upsert(
    "coaches",
    ids.coach,
    {
      userId: ids.coachUser,
      slug: "reza-moradi-demo",
      displayName: "رضا مرادی",
      shortBio: "مربی فیتنس و تمرین قدرتی",
      bio: "با ده سال تجربه در تمرین‌های قدرتی، اصلاح فرم و برنامه‌ریزی شخصی.",
      avatarMediaId: ids.coachMedia,
      coverMediaId: ids.coachMedia,
      galleryMediaIds: [],
      trainingStyles: [
        {
          title: "تمرین قدرتی دقیق",
          description: "تمرکز بر تمرین‌های کاربردی، اصلاح فرم و افزایش تدریجی فشار",
          imageMediaId: ids.coachMedia,
        },
        {
          title: "آمادگی جسمانی منظم",
          description: "برنامه ساختاریافته، انضباط تمرینی و پیگیری مداوم پیشرفت",
          imageMediaId: ids.coachMedia,
        },
      ],
      experienceSummary:
        "بیش از ۱۰ سال تجربه در تمرین‌های قدرتی، اصلاح فرم و برنامه‌ریزی شخصی برای ورزشکاران با سطوح مختلف.",
      experience: [
        {
          title: "دوره تخصصی مربیگری فیتنس",
          organization: "آکادمی ملی ورزش",
          period: "۱۳۹۵",
          description: "آموزش علمی تمرین قدرتی و طراحی برنامه",
        },
        {
          title: "مربی ارشد فیتنس",
          organization: "باشگاه کلاب‌فورمی",
          period: "۱۳۹۸ تا امروز",
          description: "همراهی ورزشکاران و توسعه برنامه‌های شخصی",
        },
      ],
      experienceYears: 10,
      languages: ["فارسی"],
      serviceModes: ["club", "online"],
      geo: {
        countryId: ids.country,
        provinceId: ids.province,
        cityId: ids.city,
        districtId: ids.district,
        cityRegionIds: [ids.region],
      },
      travelRadiusKm: 15,
      contact: {},
      reviewStatus: "approved",
      visibility: "public",
      rejectionReason: null,
      averageRating: 4.9,
      reviewsCount: 38,
    },
    now,
  );
  await upsert(
    "coach_sports",
    ids.coachSport,
    {
      coachId: ids.coach,
      sportId: ids.sport,
      specialtyIds: [],
      experienceYears: 10,
      certificateMediaIds: [],
      achievements: ["مربی منتخب باشگاه در سال ۱۴۰۴"],
      customAttributes: {},
      verificationStatus: "verified",
    },
    now,
  );
  await upsert(
    "coach_services",
    ids.offering,
    {
      coachId: ids.coach,
      sportId: ids.sport,
      title: "جلسه خصوصی فیتنس",
      normalizedTitle: "جلسه خصوصی فیتنس",
      description: "ارزیابی اولیه و تمرین اختصاصی متناسب با هدف شما",
      type: "private",
      deliveryModes: ["club", "online"],
      durationMinutes: 60,
      capacity: 1,
      price: { amount: 8500000, currency: "IRR" },
      pricingType: "per_session",
      venueClubIds: [ids.club],
      requiredEquipmentText: "لباس و کفش ورزشی",
      cancellationPolicy: {
        reservationCutoffMinutes: 60,
        ownerCancellationRefundPercent: 100,
        noShowRefundPercent: 0,
        tiers: cancellationPolicy.tiers,
      },
      coverMediaId: ids.coachMedia,
      status: "published",
    },
    now,
  );

  const courseStartAt = addDays(now, 2, 18);
  const courseEndAt = addDays(now, 30, 19);
  await upsert(
    "classes",
    ids.trainingClass,
    {
      ownerCoachId: ids.coach,
      clubId: ids.club,
      title: "دوره فیتنس مقدماتی",
      normalizedTitle: "دوره فیتنس مقدماتی",
      slug: "fitness-starter-demo",
      description:
        "دوره چهار هفته‌ای برای شروع اصولی تمرین، افزایش آمادگی و یادگیری فرم صحیح حرکات.",
      sportId: ids.sport,
      coachAssignments: [{ coachId: ids.coach, role: "primary" }],
      deliveryMode: "club",
      venue: { clubId: ids.club, address: "باشگاه انرژی پلاس" },
      capacity: 12,
      enrollmentCount: 1,
      registrationStartAt: addDays(now, -5, 8),
      registrationEndAt: addDays(now, 1, 23, 30),
      courseStartAt,
      courseEndAt,
      plannedSessionCount: 8,
      price: { amount: 24000000, currency: "IRR" },
      enrollmentMode: "requires_approval",
      coverMediaId: ids.classMedia,
      galleryMediaIds: [ids.classMedia],
      tags: ["مقدماتی", "گروهی"],
      prerequisites: ["مناسب افراد بدون سابقه تمرینی"],
      requiredEquipmentIds: [],
      amenityIds: [ids.amenity],
      cancellationPolicy: { tiers: cancellationPolicy.tiers },
      clubApprovalStatus: "approved",
      status: "published",
    },
    now,
  );
  await upsert(
    "class_enrollments",
    ids.attendeeEnrollment,
    {
      classId: ids.trainingClass,
      coachId: ids.coach,
      athleteId: ids.attendee,
      status: "active",
      priceSnapshot: { amount: 24000000, currency: "IRR" },
      paymentStatus: "paid",
      refundPercent: null,
      refundAmount: null,
      registeredAt: addDays(now, -2, 12),
      createdBy: ids.attendee,
    },
    now,
  );
  await upsert(
    "class_sessions",
    ids.classSession,
    {
      classId: ids.trainingClass,
      ownerCoachId: ids.coach,
      coachAssignments: [{ coachId: ids.coach, role: "primary" }],
      sportId: ids.sport,
      title: "جلسه اول دوره فیتنس",
      startAt: courseStartAt,
      endAt: new Date(courseStartAt.getTime() + 60 * 60_000),
      timezone: "Asia/Tehran",
      deliveryMode: "club",
      venue: { clubId: ids.club, address: "باشگاه انرژی پلاس" },
      capacity: 12,
      bookedCount: 0,
      status: "scheduled",
      publicNotes: "لطفاً ۱۵ دقیقه زودتر در باشگاه حاضر شوید.",
    },
    now,
  );
  const directStartAt = addDays(now, 1, 16);
  await upsert(
    "class_sessions",
    ids.directSession,
    {
      offeringId: ids.offering,
      ownerCoachId: ids.coach,
      coachAssignments: [{ coachId: ids.coach, role: "primary" }],
      sportId: ids.sport,
      title: "تمرین خصوصی با رضا مرادی",
      startAt: directStartAt,
      endAt: new Date(directStartAt.getTime() + 60 * 60_000),
      timezone: "Asia/Tehran",
      deliveryMode: "club",
      venue: { clubId: ids.club, address: "باشگاه انرژی پلاس" },
      capacity: 1,
      bookedCount: 0,
      status: "open_for_booking",
      publicNotes: "جلسه شامل ارزیابی اولیه است.",
    },
    now,
  );

  await upsert(
    "courts",
    ids.court,
    {
      clubId: ids.club,
      name: "سالن تمرین گروهی",
      normalizedName: "سالن تمرین گروهی",
      code: "GROUP-01",
      sportIds: [ids.sport],
      description: "سالن مجهز با تهویه و کف‌پوش استاندارد",
      capacity: 20,
      environment: "indoor",
      galleryMediaIds: [ids.clubMedia],
      isReservable: true,
      minimumReservationMinutes: 30,
      maximumReservationMinutes: 120,
      preparationMinutes: 10,
      cleanupMinutes: 10,
      status: "active",
    },
    now,
  );
  const clubSessionStartAt = addDays(now, 1, 20);
  await upsert(
    "reservable_sessions",
    ids.clubSession,
    {
      clubId: ids.club,
      courtId: ids.court,
      title: "سانس آزاد سالن تمرین",
      startsAt: clubSessionStartAt,
      endsAt: new Date(clubSessionStartAt.getTime() + 90 * 60_000),
      capacity: 8,
      reservedCount: 0,
      basePrice: 4500000,
      currency: "IRR",
      pricingUnit: "per_participant",
      options: [
        {
          _id: new Types.ObjectId("66d600000000000000000011"),
          type: "equipment",
          resourceId: ids.equipment,
          title: "ست دمبل",
          availableQuantity: 4,
          reservedQuantity: 0,
          maxPerReservation: 2,
          unitPrice: 500000,
        },
      ],
      cancellationPolicy: {
        policyId: cancellationPolicy._id,
        title: cancellationPolicy.title,
        version: 1,
        tiers: cancellationPolicy.tiers,
        reservationCutoffMinutes: 30,
        rescheduleCutoffMinutes: 120,
        noShowRefundPercent: 0,
        ownerCancellationRefundPercent: 100,
      },
      status: "active",
    },
    now,
  );

  const completedStartAt = addDays(now, -7, 18);
  await upsert(
    "reservable_sessions",
    ids.completedSession,
    {
      clubId: ids.club,
      courtId: ids.court,
      title: "سانس تمرین گروهی",
      startsAt: completedStartAt,
      endsAt: new Date(completedStartAt.getTime() + 60 * 60_000),
      capacity: 8,
      reservedCount: 1,
      basePrice: 4000000,
      currency: "IRR",
      pricingUnit: "per_participant",
      options: [],
      cancellationPolicy: {
        title: cancellationPolicy.title,
        version: 1,
        tiers: cancellationPolicy.tiers,
        reservationCutoffMinutes: 30,
        rescheduleCutoffMinutes: 120,
        noShowRefundPercent: 0,
        ownerCancellationRefundPercent: 100,
      },
      status: "completed",
    },
    now,
  );
  await upsert(
    "session_reservations",
    ids.completedReservation,
    {
      clubId: ids.club,
      sessionId: ids.completedSession,
      userId: ids.attendee,
      sessionTitle: "سانس تمرین گروهی",
      sessionStartsAt: completedStartAt,
      sessionEndsAt: new Date(completedStartAt.getTime() + 60 * 60_000),
      participantCount: 1,
      selectedOptions: [],
      totalPrice: 4000000,
      paymentStatus: "paid",
      cancellationPolicy: {
        title: cancellationPolicy.title,
        version: 1,
        tiers: cancellationPolicy.tiers,
        reservationCutoffMinutes: 30,
        rescheduleCutoffMinutes: 120,
        noShowRefundPercent: 0,
        ownerCancellationRefundPercent: 100,
      },
      refundPercent: null,
      refundAmount: null,
      status: "completed",
      cancelledAt: null,
    },
    now,
  );
  await upsert(
    "club_reviews",
    ids.review,
    {
      clubId: ids.club,
      userId: ids.attendee,
      reservationId: ids.completedReservation,
      rating: 5,
      title: "تجربه عالی",
      body: "محیط تمیز، تجهیزات کامل و برخورد حرفه‌ای پرسنل.",
      ratings: { cleanliness: 5, staff: 5, equipment: 5 },
      mediaIds: [],
      isVerifiedBooking: true,
      ownerResponse: null,
      status: "published",
    },
    now,
  );

  const sections = [
    {
      _id: id("66d700000000000000000001"),
      key: "demo-banner",
      type: "banners",
      title: "شروع یک تمرین بهتر",
      subtitle: "رزرو باشگاه، مربی و کلاس در یک اپ",
      position: 0,
      selection: {
        mode: "query",
        itemIds: [],
        limit: 6,
        sort: "newest",
        filters: {},
      },
      banners: [
        {
          title: "همین امروز شروع کن",
          subtitle: "سانس‌ها و کلاس‌های نزدیکت را آنلاین رزرو کن",
          imageUrl:
            "https://images.unsplash.com/photo-1534438327276-14e7789c4591?auto=format&fit=crop&w=1400&q=85",
          actionLabel: "مشاهده باشگاه‌ها",
          actionUrl: "/discovery/clubs",
        },
      ],
    },
    {
      _id: id("66d700000000000000000002"),
      key: "demo-clubs",
      type: "clubs",
      title: "باشگاه‌های پیشنهادی",
      subtitle: "انتخاب‌های تأییدشده جیم‌فورمی",
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
      _id: id("66d700000000000000000003"),
      key: "demo-coaches",
      type: "coaches",
      title: "مربی‌های حرفه‌ای",
      subtitle: "جلسه خصوصی یا کلاس گروهی",
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
  ];
  for (const section of sections) {
    await upsert(
      "discovery_sections",
      section._id,
      {
        key: section.key,
        type: section.type,
        title: section.title,
        subtitle: section.subtitle,
        layout: "carousel",
        viewAllLabel: "مشاهده همه",
        viewAllUrl:
          section.type === "clubs"
            ? "/discovery/clubs"
            : section.type === "coaches"
              ? "/discovery/coaches"
              : "",
        enabled: true,
        position: section.position,
        selection: section.selection,
        banners: section.banners,
      },
      now,
    );
  }

  console.log("Demo seed is ready.");
  console.log(
    process.env.NODE_ENV === "production"
      ? "Demo password was read from SEED_DEMO_PASSWORD."
      : `Local demo password: ${LOCAL_DEMO_PASSWORD}`,
  );
  console.log("Athlete: 09120000001 | Coach: 09120000003");
  console.log("Owner: 09120000004 | Admin: 09120000005");
  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
