const database = db.getSiblingDB("gym4me");
const now = new Date();

const objectId = (value) => ObjectId(value);
const requiredByCode = (collection, code) => {
  const value = database.getCollection(collection).findOne({ code });
  if (!value) throw new Error(`Missing ${collection} resource: ${code}`);
  return value;
};
const firstForCity = (collection, cityId) =>
  database.getCollection(collection).findOne({ cityId, isActive: true });
const atDayOffset = (days, hour = 9) => {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value;
};
const upsert = (collection, id, value, createdAt = now) =>
  database.getCollection(collection).updateOne(
    { _id: id },
    {
      $set: { ...value, updatedAt: now },
      $setOnInsert: { createdAt },
    },
    { upsert: true },
  );

const country = requiredByCode("countries", "IR");
const cities = {
  tehran: requiredByCode("cities", "TEHRAN_CITY"),
  karaj: requiredByCode("cities", "KARAJ"),
  mashhad: requiredByCode("cities", "MASHHAD"),
  isfahan: requiredByCode("cities", "ISFAHAN_CITY"),
};
const sports = {
  bodybuilding: requiredByCode("sports", "BODYBUILDING"),
  fitness: requiredByCode("sports", "FITNESS"),
  functional: requiredByCode("sports", "FUNCTIONAL_TRAINING"),
  cross: requiredByCode("sports", "CROSS_TRAINING"),
  yoga: requiredByCode("sports", "YOGA"),
  pilates: requiredByCode("sports", "PILATES"),
  swimming: requiredByCode("sports", "SWIMMING"),
  boxing: requiredByCode("sports", "BOXING"),
};
const clubTypes = {
  gym: requiredByCode("club_types", "GYM"),
  complex: requiredByCode("club_types", "SPORT_COMPLEX"),
  pool: requiredByCode("club_types", "POOL"),
  studio: requiredByCode("club_types", "STUDIO"),
  martial: requiredByCode("club_types", "MARTIAL_ARTS"),
};
const amenities = ["LOCKER_ROOM", "SHOWER", "PARKING", "AIR_CONDITIONING"]
  .map((code) => requiredByCode("amenities", code)._id);
const equipment = ["DUMBBELL", "TREADMILL", "EXERCISE_MAT", "KETTLEBELL"]
  .map((code) => requiredByCode("equipment", code)._id);

const ids = {
  owner: objectId("70d100000000000000000001"),
  clubs: Array.from({ length: 8 }, (_, index) =>
    objectId(`70d20000000000000000000${index + 1}`),
  ),
  coaches: Array.from({ length: 8 }, (_, index) =>
    objectId(`70d30000000000000000000${index + 1}`),
  ),
  coachUsers: Array.from({ length: 8 }, (_, index) =>
    objectId(`70d40000000000000000000${index + 1}`),
  ),
  classes: Array.from({ length: 10 }, (_, index) =>
    objectId(`70d5000000000000000000${String(index + 1).padStart(2, "0")}`),
  ),
  clubMedia: Array.from({ length: 8 }, (_, index) =>
    objectId(`70d60000000000000000000${index + 1}`),
  ),
  coachMedia: Array.from({ length: 8 }, (_, index) =>
    objectId(`70d70000000000000000000${index + 1}`),
  ),
  classMedia: Array.from({ length: 10 }, (_, index) =>
    objectId(`70d8000000000000000000${String(index + 1).padStart(2, "0")}`),
  ),
};

const clubImages = [
  "https://images.unsplash.com/photo-1534438327276-14e7789c4591?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=1400&q=82",
];
const coachImages = [
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1609899464726-209befaac5bc?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=900&q=82",
];
const classImages = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1510894347712-4b85b70e9f54?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=82",
];

[...clubImages, ...coachImages, ...classImages].forEach((url, index) => {
  const allMediaIds = [...ids.clubMedia, ...ids.coachMedia, ...ids.classMedia];
  upsert("media", allMediaIds[index], {
    ownerId: ids.owner,
    url,
    mimeType: "image/jpeg",
    hash: `production-discovery-${index + 1}`,
    byteSize: 0,
    status: "ready",
  });
});

const clubData = [
  ["باشگاه پالس نیاوران", "pulse-niavaran", "فضای مدرن برای بدنسازی و تمرین عملکردی", cities.tehran, "TEHRAN_NORTH", [sports.bodybuilding, sports.functional], clubTypes.gym, "تهران، نیاوران، خیابان باهنر", [51.461, 35.813], 4.9, 186],
  ["استودیو حرکت ونک", "harekat-vanak", "کلاس‌های تخصصی یوگا، پیلاتس و تمرینات گروهی", cities.tehran, "TEHRAN_CENTER", [sports.yoga, sports.pilates], clubTypes.studio, "تهران، میدان ونک، خیابان خدامی", [51.409, 35.757], 4.8, 143],
  ["مجموعه ورزشی آوان", "avan-sport-complex", "مجموعه کامل برای فیتنس، کراس ترینینگ و ورزش‌های گروهی", cities.tehran, "TEHRAN_WEST", [sports.fitness, sports.cross], clubTypes.complex, "تهران، شهرک غرب، بلوار دادمان", [51.371, 35.767], 4.7, 98],
  ["باشگاه موج آبی", "moj-abi-pool", "استخر، آموزش شنا و ریکاوری در محیطی آرام", cities.karaj, "KARAJ_CENTER", [sports.swimming], clubTypes.pool, "کرج، عظیمیه، بلوار شریعتی", [50.998, 35.842], 4.9, 121],
  ["خانه قدرت مشهد", "power-house-mashhad", "تمرین قدرتی با تجهیزات حرفه‌ای و برنامه اختصاصی", cities.mashhad, "MASHHAD_CENTER", [sports.bodybuilding, sports.fitness], clubTypes.gym, "مشهد، بلوار سجاد، خیابان بهار", [59.567, 36.321], 4.6, 74],
  ["استودیو نفس اصفهان", "nafas-isfahan", "یوگا و پیلاتس برای آرامش، انعطاف و قدرت بیشتر", cities.isfahan, "ISFAHAN_CENTER", [sports.yoga, sports.pilates], clubTypes.studio, "اصفهان، چهارباغ بالا، مجتمع پارسیان", [51.665, 32.632], 4.8, 89],
  ["باشگاه رینگ شرق", "ring-shargh", "آموزش بوکس از سطح مقدماتی تا مسابقه", cities.tehran, "TEHRAN_EAST", [sports.boxing, sports.functional], clubTypes.martial, "تهران، تهرانپارس، خیابان رشید", [51.536, 35.731], 4.7, 67],
  ["باشگاه اوج سعادت‌آباد", "owj-saadatabad", "فیتنس خانوادگی با برنامه‌های متنوع صبح و عصر", cities.tehran, "TEHRAN_WEST", [sports.fitness, sports.bodybuilding, sports.pilates], clubTypes.gym, "تهران، سعادت‌آباد، بلوار پاکنژاد", [51.374, 35.789], 4.9, 211],
];

clubData.forEach((item, index) => {
  const [name, slug, shortDescription, city, regionCode, selectedSports, type, address, coordinates, averageRating, reviewsCount] = item;
  const province = database.provinces.findOne({ _id: city.provinceId });
  const district = firstForCity("districts", city._id);
  const region = requiredByCode("city_regions", regionCode);
  upsert(
    "clubs",
    ids.clubs[index],
    {
      ownerId: ids.owner,
      name,
      normalizedName: name,
      slug,
      shortDescription,
      description: `${shortDescription}. این مجموعه با فضای استاندارد، مربی‌های باتجربه و امکان انتخاب برنامه متناسب با هدف شما آماده میزبانی است.`,
      coverMediaId: ids.clubMedia[index],
      gallery: [{ mediaId: ids.clubMedia[index], title: "نمای مجموعه", altText: name, kind: "image", position: 0, isCover: true, category: "training" }],
      equipment: equipment.map((resourceId, equipmentIndex) => ({ resourceId, quantity: 4 + equipmentIndex * 3, reservableQuantity: 0, status: "available", description: "" })),
      amenities: amenities.map((resourceId) => ({ resourceId, availability: "included", description: "" })),
      rules: ["همراه داشتن کفش و لباس ورزشی الزامی است.", "لطفاً ۱۰ دقیقه پیش از شروع برنامه در مجموعه حاضر باشید."],
      faqs: [{ question: "امکان جلسه آزمایشی وجود دارد؟", answer: "بله، برای برنامه‌های منتخب امکان هماهنگی جلسه آزمایشی وجود دارد." }],
      geo: { countryId: country._id, provinceId: province._id, cityId: city._id, districtId: district?._id ?? null, cityRegionIds: [region._id] },
      address,
      location: { type: "Point", coordinates },
      timezone: "Asia/Tehran",
      socialMedia: [],
      clubTypeIds: [type._id],
      sportIds: selectedSports.map((sport) => sport._id),
      tags: ["پیشنهادی", "رزرو آنلاین", "نمونه نمایشی"],
      weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, periods: [{ opensAt: "07:00", closesAt: "22:30" }], isClosed: false })),
      closures: [],
      audience: ["mixed"],
      currency: "IRR",
      taxPercent: 0,
      averageRating,
      reviewsCount,
      operationalStatus: "active",
      reviewStatus: "approved",
      visibility: "public",
      rejectionReason: null,
      publishedAt: atDayOffset(-index - 1),
      schemaVersion: 2,
      createdBy: ids.owner,
      updatedBy: ids.owner,
    },
    atDayOffset(-index - 1),
  );
});

const coachData = [
  ["آرمان نیک‌پی", "arman-nikpay", "مربی بدنسازی و افزایش قدرت", sports.bodybuilding, cities.tehran, "TEHRAN_NORTH", ["club", "online"], 11, 4.9, 132],
  ["رها کیانی", "raha-kiani", "مربی یوگا و تمرکز ذهن", sports.yoga, cities.tehran, "TEHRAN_CENTER", ["club", "online"], 8, 4.9, 109],
  ["سامیار فرهمند", "samyar-farahmand", "مربی کراس ترینینگ و آمادگی جسمانی", sports.cross, cities.tehran, "TEHRAN_WEST", ["club"], 9, 4.8, 94],
  ["بهار زمانی", "bahar-zamani", "مربی پیلاتس و اصلاح الگوی حرکتی", sports.pilates, cities.isfahan, "ISFAHAN_CENTER", ["club", "online"], 7, 4.8, 81],
  ["کیان رستگار", "kian-rastegar", "مربی شنا و آمادگی در آب", sports.swimming, cities.karaj, "KARAJ_CENTER", ["club"], 12, 4.7, 76],
  ["نیلوفر پارسا", "niloufar-parsa", "مربی فیتنس بانوان و تناسب اندام", sports.fitness, cities.mashhad, "MASHHAD_CENTER", ["club", "online"], 6, 4.9, 117],
  ["ماهان شریفی", "mahan-sharifi", "مربی بوکس و تمرین عملکردی", sports.boxing, cities.tehran, "TEHRAN_EAST", ["club"], 10, 4.7, 63],
  ["آوا مهرگان", "ava-mehregan", "مربی تمرین عملکردی و فیتنس آنلاین", sports.functional, cities.tehran, "TEHRAN_WEST", ["online", "home"], 5, 4.8, 58],
];

coachData.forEach((item, index) => {
  const [displayName, slug, shortBio, sport, city, regionCode, serviceModes, experienceYears, averageRating, reviewsCount] = item;
  const province = database.provinces.findOne({ _id: city.provinceId });
  const district = firstForCity("districts", city._id);
  const region = requiredByCode("city_regions", regionCode);
  upsert(
    "coaches",
    ids.coaches[index],
    {
      userId: ids.coachUsers[index],
      slug,
      displayName,
      shortBio,
      bio: `${shortBio} با تمرکز روی برنامه‌ریزی اصولی، اجرای درست حرکات و پیگیری منظم پیشرفت ورزشکار.`,
      avatarMediaId: ids.coachMedia[index],
      coverMediaId: ids.coachMedia[index],
      galleryMediaIds: [],
      specialties: [{ title: sport.name, description: `طراحی برنامه تخصصی ${sport.name}`, icon: "award" }, { title: "برنامه شخصی", description: "متناسب با سطح، هدف و زمان‌بندی شما", icon: "target" }],
      trainingStyles: [{ title: "تمرین هدفمند", description: "ارزیابی، برنامه‌ریزی و پیگیری مرحله‌به‌مرحله", imageMediaId: ids.coachMedia[index] }],
      experienceSummary: `${experienceYears} سال تجربه حرفه‌ای در آموزش و همراهی ورزشکاران با سطوح مختلف.`,
      experience: [{ title: `مربی تخصصی ${sport.name}`, organization: "آکادمی ورزش ایران", period: `بیش از ${experienceYears} سال`, description: "طراحی و اجرای برنامه‌های فردی و گروهی" }],
      faqs: [{ question: "برنامه برای افراد مبتدی هم مناسب است؟", answer: "بله، برنامه پس از ارزیابی اولیه و متناسب با سطح شما تنظیم می‌شود." }],
      experienceYears,
      languages: ["فارسی"],
      serviceModes,
      minAcceptedAge: 16,
      maxAcceptedAge: 65,
      geo: { countryId: country._id, provinceId: province._id, cityId: city._id, districtId: district?._id, cityRegionIds: [region._id] },
      travelRadiusKm: serviceModes.includes("home") ? 12 : 0,
      contact: {},
      reviewStatus: "approved",
      visibility: "public",
      rejectionReason: null,
      averageRating,
      reviewsCount,
    },
    atDayOffset(-index - 1),
  );
  upsert("coach_sports", objectId(`70d90000000000000000000${index + 1}`), {
    coachId: ids.coaches[index],
    sportId: sport._id,
    specialtyIds: [],
    experienceYears,
    certificateMediaIds: [],
    achievements: ["مربی تأییدشده جیم‌فورمی"],
    customAttributes: {},
    verificationStatus: "verified",
  });
});

const classData = [
  ["شروع قدرتمند بدنسازی", "strong-start-bodybuilding", sports.bodybuilding, 0, 0, "club", 12, 6, 28500000],
  ["یوگای صبحگاهی", "morning-yoga-flow", sports.yoga, 1, 1, "club", 14, 9, 19000000],
  ["کراس ترینینگ فشرده", "intense-cross-training", sports.cross, 2, 2, "club", 10, 7, 32000000],
  ["پیلاتس برای ستون فقرات", "pilates-for-spine", sports.pilates, 3, 5, "club", 12, 8, 24000000],
  ["آموزش شنای بزرگسال", "adult-swimming-course", sports.swimming, 4, 3, "club", 8, 5, 36000000],
  ["فیتنس بانوان در خانه", "online-women-fitness", sports.fitness, 5, null, "online", 20, 11, 17000000],
  ["بوکس از پایه", "boxing-from-basics", sports.boxing, 6, 6, "club", 10, 4, 27000000],
  ["تمرین عملکردی آنلاین", "online-functional-training", sports.functional, 7, null, "online", 24, 15, 15000000],
  ["چالش چهار هفته‌ای تناسب اندام", "four-week-fitness-challenge", sports.fitness, 5, 4, "club", 16, 10, 29500000],
  ["قدرت و انعطاف", "strength-and-mobility", sports.functional, 0, 7, "club", 12, 3, 26000000],
];

classData.forEach((item, index) => {
  const [title, slug, sport, coachIndex, clubIndex, deliveryMode, capacity, enrollmentCount, amount] = item;
  const clubId = clubIndex === null ? null : ids.clubs[clubIndex];
  const start = atDayOffset(3 + index, index % 2 === 0 ? 18 : 9);
  const end = atDayOffset(31 + index, index % 2 === 0 ? 19 : 10);
  const value = {
    ownerCoachId: ids.coaches[coachIndex],
    title,
    normalizedTitle: title,
    slug,
    description: `یک دوره کاربردی ${sport.name} با برنامه مرحله‌ای، آموزش اصولی و همراهی مربی برای رسیدن به نتیجه‌ای پایدار.`,
    sportId: sport._id,
    coachAssignments: [{ coachId: ids.coaches[coachIndex], role: "primary" }],
    deliveryMode,
    venue: clubId ? { clubId, address: clubData[clubIndex][7] } : { onlineUrl: "https://app.gym4me.ir" },
    capacity,
    enrollmentCount,
    registrationStartAt: atDayOffset(-4),
    registrationEndAt: atDayOffset(2 + index, 23),
    courseStartAt: start,
    courseEndAt: end,
    plannedSessionCount: 8,
    price: { amount, currency: "IRR" },
    enrollmentMode: "requires_approval",
    coverMediaId: ids.classMedia[index],
    galleryMediaIds: [ids.classMedia[index]],
    tags: ["پیشنهادی", "دوره جدید"],
    prerequisites: ["مناسب سطح مقدماتی تا متوسط"],
    requiredEquipmentIds: [],
    amenityIds: clubId ? amenities.slice(0, 2) : [],
    cancellationPolicy: { tiers: [{ hoursBefore: 24, refundPercent: 100 }, { hoursBefore: 6, refundPercent: 50 }, { hoursBefore: 0, refundPercent: 0 }] },
    clubApprovalStatus: clubId ? "approved" : undefined,
    status: "published",
    faqs: [{ question: "برای شرکت در دوره چه وسایلی لازم است؟", answer: "لباس و کفش ورزشی کافی است؛ موارد تخصصی پیش از شروع اعلام می‌شود." }],
  };
  if (clubId) value.clubId = clubId;
  upsert("classes", ids.classes[index], value, atDayOffset(-index - 1));
});

database.discovery_sections.updateOne(
  { key: "featured-banners" },
  {
    $set: {
      title: "انتخاب‌های ویژه برای تو",
      subtitle: "یک شروع تازه برای حرکت، انرژی و حال بهتر",
      banners: [
        { title: "کلاس‌های تازه، همین هفته", subtitle: "از یوگا تا کراس ترینینگ؛ زمان مناسب خودت را انتخاب کن", imageUrl: classImages[0], actionLabel: "دیدن کلاس‌ها", actionUrl: "/discovery/classes" },
        { title: "مربی مناسب هدفت را پیدا کن", subtitle: "مربی‌های تأییدشده برای تمرین حضوری و آنلاین", imageUrl: coachImages[1], actionLabel: "مشاهده مربی‌ها", actionUrl: "/discovery/coaches" },
        { title: "باشگاه‌های محبوب نزدیک تو", subtitle: "امکانات، موقعیت و امتیاز کاربران را یک‌جا مقایسه کن", imageUrl: clubImages[1], actionLabel: "کشف باشگاه‌ها", actionUrl: "/discovery/clubs" },
        { title: "هر جا هستی تمرین کن", subtitle: "کلاس و مربی آنلاین، متناسب با برنامه روزانه تو", imageUrl: classImages[7], actionLabel: "شروع جست‌وجو", actionUrl: "/discovery/search" },
      ],
      updatedAt: now,
    },
  },
);

printjson({
  seeded: true,
  clubs: database.clubs.countDocuments({ _id: { $in: ids.clubs } }),
  coaches: database.coaches.countDocuments({ _id: { $in: ids.coaches } }),
  classes: database.classes.countDocuments({ _id: { $in: ids.classes } }),
  media: database.media.countDocuments({ _id: { $in: [...ids.clubMedia, ...ids.coachMedia, ...ids.classMedia] } }),
  featuredBanners: database.discovery_sections.findOne({ key: "featured-banners" }).banners.length,
});
