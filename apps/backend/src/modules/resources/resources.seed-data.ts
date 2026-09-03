export type ResourceSeedValue = string | number | boolean | readonly string[];
export type ResourceSeedRecord = Readonly<Record<string, ResourceSeedValue>>;

const named = (...items: readonly (readonly [name: string, code: string])[]) =>
  items.map(([name, code], sortOrder) => ({ name, code, sortOrder }));

export const resourceSeedData: Readonly<
  Record<string, readonly ResourceSeedRecord[]>
> = {
  sport_categories: named(
    ["تناسب اندام", "FITNESS"],
    ["ورزش‌های توپی", "BALL_SPORTS"],
    ["ورزش‌های رزمی", "MARTIAL_ARTS"],
    ["ورزش‌های آبی", "WATER_SPORTS"],
  ),
  sports: [
    {
      name: "بدنسازی",
      code: "BODYBUILDING",
      categoryId: "@FITNESS",
      sortOrder: 1,
    },
    { name: "فیتنس", code: "FITNESS", categoryId: "@FITNESS", sortOrder: 2 },
    {
      name: "فوتبال",
      code: "FOOTBALL",
      categoryId: "@BALL_SPORTS",
      sortOrder: 3,
    },
    {
      name: "والیبال",
      code: "VOLLEYBALL",
      categoryId: "@BALL_SPORTS",
      sortOrder: 4,
    },
    {
      name: "شنا",
      code: "SWIMMING",
      categoryId: "@WATER_SPORTS",
      sortOrder: 5,
    },
    { name: "بوکس", code: "BOXING", categoryId: "@MARTIAL_ARTS", sortOrder: 6 },
  ],
  club_types: named(
    ["باشگاه بدنسازی", "GYM"],
    ["مجموعه ورزشی", "SPORT_COMPLEX"],
    ["استخر", "POOL"],
    ["آکادمی تخصصی", "ACADEMY"],
  ),
  coach_types: named(
    ["مربی خصوصی", "PERSONAL"],
    ["مربی گروهی", "GROUP"],
    ["مربی آنلاین", "ONLINE"],
  ),
  class_types: named(
    ["خصوصی", "PRIVATE"],
    ["نیمه‌خصوصی", "SEMI_PRIVATE"],
    ["گروهی", "GROUP"],
  ),
  court_types: [
    {
      name: "زمین فوتبال",
      code: "FOOTBALL_FIELD",
      supportedSportIds: ["@FOOTBALL"],
    },
    {
      name: "سالن والیبال",
      code: "VOLLEYBALL_HALL",
      supportedSportIds: ["@VOLLEYBALL"],
    },
    {
      name: "استخر سرپوشیده",
      code: "INDOOR_POOL",
      supportedSportIds: ["@SWIMMING"],
    },
    {
      name: "سالن چندمنظوره",
      code: "MULTIPURPOSE_HALL",
      supportedSportIds: ["@FOOTBALL", "@VOLLEYBALL"],
    },
  ],
  coach_specialties: [
    {
      name: "عضله‌سازی و افزایش قدرت",
      code: "STRENGTH",
      sportIds: ["@BODYBUILDING", "@FITNESS"],
    },
    { name: "کاهش وزن", code: "WEIGHT_LOSS", sportIds: ["@FITNESS"] },
    { name: "تکنیک بوکس", code: "BOXING_TECHNIQUE", sportIds: ["@BOXING"] },
  ],
  skill_levels: named(
    ["مبتدی", "BEGINNER"],
    ["متوسط", "INTERMEDIATE"],
    ["پیشرفته", "ADVANCED"],
    ["حرفه‌ای", "PROFESSIONAL"],
  ),

  amenity_categories: named(
    ["رفاهی", "COMFORT"],
    ["بهداشتی", "HYGIENE"],
    ["دسترسی", "ACCESSIBILITY"],
  ),
  amenities: [
    { name: "رختکن", code: "LOCKER_ROOM", categoryId: "@COMFORT" },
    { name: "دوش", code: "SHOWER", categoryId: "@HYGIENE" },
    { name: "پارکینگ", code: "PARKING", categoryId: "@ACCESSIBILITY" },
    { name: "کمد اختصاصی", code: "LOCKER", categoryId: "@COMFORT" },
    { name: "تهویه مطبوع", code: "AIR_CONDITIONING", categoryId: "@COMFORT" },
  ],
  equipment_categories: named(
    ["قدرتی", "STRENGTH"],
    ["هوازی", "CARDIO"],
    ["تمرین آزاد", "FREE_WEIGHT"],
  ),
  equipment: [
    {
      name: "تردمیل",
      code: "TREADMILL",
      categoryId: "@CARDIO",
      sportIds: ["@FITNESS"],
    },
    {
      name: "دوچرخه ثابت",
      code: "STATIONARY_BIKE",
      categoryId: "@CARDIO",
      sportIds: ["@FITNESS"],
    },
    {
      name: "دمبل",
      code: "DUMBBELL",
      categoryId: "@FREE_WEIGHT",
      sportIds: ["@BODYBUILDING", "@FITNESS"],
    },
    {
      name: "هالتر و صفحه وزنه",
      code: "BARBELL",
      categoryId: "@FREE_WEIGHT",
      sportIds: ["@BODYBUILDING"],
    },
    {
      name: "دستگاه اسمیت",
      code: "SMITH_MACHINE",
      categoryId: "@STRENGTH",
      sportIds: ["@BODYBUILDING"],
    },
    {
      name: "لت سیم‌کش",
      code: "LAT_PULLDOWN",
      categoryId: "@STRENGTH",
      sportIds: ["@BODYBUILDING"],
    },
  ],
  court_surface_types: named(
    ["چمن طبیعی", "NATURAL_GRASS"],
    ["چمن مصنوعی", "ARTIFICIAL_GRASS"],
    ["پارکت", "PARQUET"],
    ["تارتان", "TARTAN"],
    ["کف‌پوش ورزشی", "SPORT_FLOOR"],
  ),
  court_feature_types: named(
    ["سرپوشیده", "INDOOR"],
    ["روباز", "OUTDOOR"],
    ["نورپردازی شب", "NIGHT_LIGHTING"],
    ["سکوی تماشاگر", "BLEACHERS"],
  ),
  service_types: named(
    ["برنامه تمرینی", "WORKOUT_PLAN"],
    ["مشاوره تغذیه", "NUTRITION"],
    ["ارزیابی بدنی", "BODY_ASSESSMENT"],
    ["مربی خصوصی", "PERSONAL_TRAINING"],
  ),

  countries: [
    { name: "ایران", code: "IR", aliases: ["جمهوری اسلامی ایران", "Iran"] },
  ],
  provinces: [
    { name: "تهران", code: "TEHRAN", countryId: "@IR" },
    { name: "البرز", code: "ALBORZ", countryId: "@IR" },
  ],
  cities: [
    { name: "تهران", code: "TEHRAN_CITY", provinceId: "@TEHRAN" },
    { name: "کرج", code: "KARAJ", provinceId: "@ALBORZ" },
  ],
  districts: [
    { name: "منطقه ۱", code: "TEHRAN_DISTRICT_1", cityId: "@TEHRAN_CITY" },
    { name: "منطقه ۲", code: "TEHRAN_DISTRICT_2", cityId: "@TEHRAN_CITY" },
    { name: "منطقه ۳", code: "TEHRAN_DISTRICT_3", cityId: "@TEHRAN_CITY" },
    { name: "منطقه ۶", code: "TEHRAN_DISTRICT_6", cityId: "@TEHRAN_CITY" },
    { name: "منطقه ۲۲", code: "TEHRAN_DISTRICT_22", cityId: "@TEHRAN_CITY" },
  ],
  neighborhoods: [
    { name: "تجریش", code: "TAJRISH", districtId: "@TEHRAN_DISTRICT_1" },
    { name: "زعفرانیه", code: "ZAFARANIYEH", districtId: "@TEHRAN_DISTRICT_1" },
    {
      name: "سعادت‌آباد",
      code: "SAADAT_ABAD",
      districtId: "@TEHRAN_DISTRICT_2",
    },
    {
      name: "شهرک غرب",
      code: "SHAHRAK_GHARB",
      districtId: "@TEHRAN_DISTRICT_2",
    },
    { name: "ونک", code: "VANAK", districtId: "@TEHRAN_DISTRICT_3" },
    {
      name: "یوسف‌آباد",
      code: "YOUSOF_ABAD",
      districtId: "@TEHRAN_DISTRICT_6",
    },
    { name: "چیتگر", code: "CHITGAR", districtId: "@TEHRAN_DISTRICT_22" },
  ],
  city_regions: [
    { name: "شمال تهران", code: "TEHRAN_NORTH", cityId: "@TEHRAN_CITY" },
    { name: "مرکز تهران", code: "TEHRAN_CENTER", cityId: "@TEHRAN_CITY" },
    { name: "غرب تهران", code: "TEHRAN_WEST", cityId: "@TEHRAN_CITY" },
    { name: "شرق تهران", code: "TEHRAN_EAST", cityId: "@TEHRAN_CITY" },
  ],

  class_goal_types: [
    { name: "کاهش وزن", code: "WEIGHT_LOSS", sportIds: ["@FITNESS"] },
    { name: "افزایش قدرت", code: "STRENGTH_GAIN", sportIds: ["@BODYBUILDING"] },
    {
      name: "یادگیری مهارت",
      code: "SKILL_LEARNING",
      sportIds: ["@BOXING", "@SWIMMING"],
    },
  ],
  class_intensity_levels: named(
    ["سبک", "LOW"],
    ["متوسط", "MEDIUM"],
    ["شدید", "HIGH"],
  ),
  class_skill_levels: named(
    ["مقدماتی", "BEGINNER"],
    ["متوسط", "INTERMEDIATE"],
    ["پیشرفته", "ADVANCED"],
  ),
  class_format_types: named(
    ["حضوری", "IN_PERSON"],
    ["آنلاین", "ONLINE"],
    ["ترکیبی", "HYBRID"],
  ),
  required_item_types: [
    {
      name: "کفش ورزشی",
      code: "SPORT_SHOES",
      sportIds: ["@FITNESS", "@VOLLEYBALL"],
    },
    { name: "دستکش بوکس", code: "BOXING_GLOVES", sportIds: ["@BOXING"] },
    { name: "مایو و کلاه شنا", code: "SWIMWEAR", sportIds: ["@SWIMMING"] },
  ],
  age_group_presets: [
    { name: "کودکان", minAge: 6, maxAge: 11 },
    { name: "نوجوانان", minAge: 12, maxAge: 17 },
    { name: "بزرگسالان", minAge: 18, maxAge: 59 },
    { name: "سالمندان", minAge: 60, maxAge: 100 },
  ],

  article_categories: named(
    ["تمرین", "TRAINING"],
    ["تغذیه", "NUTRITION"],
    ["سلامت", "HEALTH"],
    ["اخبار", "NEWS"],
  ),
  article_types: named(
    ["مقاله آموزشی", "EDUCATIONAL"],
    ["راهنما", "GUIDE"],
    ["خبر", "NEWS"],
  ),
  article_tags: named(
    ["بدنسازی", "BODYBUILDING"],
    ["تغذیه سالم", "HEALTHY_NUTRITION"],
    ["سبک زندگی", "LIFESTYLE"],
  ),
  faq_categories: named(
    ["عضویت", "MEMBERSHIP"],
    ["رزرو کلاس", "BOOKING"],
    ["پرداخت", "PAYMENT"],
  ),
  page_types: named(
    ["صفحه ثابت", "STATIC"],
    ["صفحه فرود", "LANDING"],
    ["صفحه کمپین", "CAMPAIGN"],
  ),
  banner_types: named(
    ["تصویری", "IMAGE"],
    ["متنی", "TEXT"],
    ["ویدیویی", "VIDEO"],
  ),
  banner_positions: named(
    ["بالای صفحه", "HERO"],
    ["میان محتوا", "INLINE"],
    ["پایین صفحه", "FOOTER"],
  ),
  notification_categories: named(
    ["رزرو", "BOOKING"],
    ["پرداخت", "PAYMENT"],
    ["یادآوری", "REMINDER"],
    ["سیستمی", "SYSTEM"],
  ),
  featured_collection_types: named(
    ["باشگاه‌های منتخب", "FEATURED_CLUBS"],
    ["کلاس‌های محبوب", "POPULAR_CLASSES"],
    ["مربیان برتر", "TOP_COACHES"],
  ),

  verification_document_types: named(
    ["کارت ملی", "NATIONAL_ID"],
    ["مدرک مربیگری", "COACH_CERTIFICATE"],
    ["مجوز فعالیت", "BUSINESS_LICENSE"],
  ),
  club_rejection_reasons: named(
    ["مدارک ناقص", "INCOMPLETE_DOCUMENTS"],
    ["اطلاعات تماس نامعتبر", "INVALID_CONTACT"],
    ["عدم تطابق مجوز", "LICENSE_MISMATCH"],
  ),
  coach_rejection_reasons: named(
    ["مدرک نامعتبر", "INVALID_CERTIFICATE"],
    ["سابقه ناکافی", "INSUFFICIENT_EXPERIENCE"],
    ["اطلاعات ناقص", "INCOMPLETE_PROFILE"],
  ),
  report_reasons: named(
    ["اطلاعات نادرست", "FALSE_INFORMATION"],
    ["محتوای نامناسب", "INAPPROPRIATE_CONTENT"],
    ["رفتار توهین‌آمیز", "ABUSIVE_BEHAVIOR"],
  ),
  review_report_reasons: named(
    ["نظر اسپم", "SPAM"],
    ["توهین‌آمیز", "ABUSIVE"],
    ["نامرتبط", "IRRELEVANT"],
  ),
  suspension_reasons: named(
    ["نقض قوانین", "POLICY_VIOLATION"],
    ["مدارک منقضی", "EXPIRED_DOCUMENTS"],
    ["فعالیت مشکوک", "SUSPICIOUS_ACTIVITY"],
  ),
  support_ticket_categories: named(
    ["مشکل فنی", "TECHNICAL"],
    ["حساب کاربری", "ACCOUNT"],
    ["رزرو و کلاس", "BOOKING"],
    ["امور مالی", "FINANCE"],
  ),

  badge_types: [
    { name: "تأییدشده", code: "VERIFIED", color: "#2563EB" },
    { name: "مربی برتر", code: "TOP_COACH", color: "#F59E0B" },
    { name: "باشگاه محبوب", code: "POPULAR_CLUB", color: "#10B981" },
  ],
  featured_collections: [
    {
      title: "باشگاه‌های منتخب تهران",
      typeId: "@FEATURED_CLUBS",
      entityType: "club",
      itemIds: [],
    },
    {
      title: "کلاس‌های محبوب این هفته",
      typeId: "@POPULAR_CLASSES",
      entityType: "class",
      itemIds: [],
    },
  ],
  search_keywords: named(
    ["باشگاه بدنسازی", "GYM"],
    ["کلاس فیتنس", "FITNESS_CLASS"],
    ["مربی خصوصی", "PERSONAL_COACH"],
  ),
  search_synonyms: [
    { canonicalTerm: "باشگاه", synonyms: ["جیم", "سالن ورزشی"] },
    { canonicalTerm: "بدنسازی", synonyms: ["فیتنس", "پرورش اندام"] },
  ],
  popular_searches: [
    { phrase: "باشگاه بدنسازی تهران", weight: 100, cityId: "@TEHRAN_CITY" },
    { phrase: "مربی خصوصی", weight: 80, cityId: "@TEHRAN_CITY" },
  ],
  discovery_sections: [
    {
      title: "باشگاه‌های منتخب",
      code: "FEATURED_CLUBS",
      entityType: "club",
      collectionId: "@باشگاه‌های منتخب تهران",
      placement: "home",
      displayLimit: 10,
    },
    {
      title: "کلاس‌های محبوب",
      code: "POPULAR_CLASSES",
      entityType: "class",
      collectionId: "@کلاس‌های محبوب این هفته",
      placement: "home",
      displayLimit: 10,
    },
  ],

  membership_plan_types: named(
    ["عضویت ماهانه", "MONTHLY"],
    ["عضویت فصلی", "QUARTERLY"],
    ["عضویت سالانه", "ANNUAL"],
  ),
  pricing_models: [
    { name: "به‌ازای جلسه", code: "PER_SESSION", billingUnit: "session" },
    { name: "اشتراک ثابت", code: "SUBSCRIPTION", billingUnit: "period" },
  ],
  subscription_periods: [
    { name: "یک‌ماهه", durationValue: 1, durationUnit: "month" },
    { name: "سه‌ماهه", durationValue: 3, durationUnit: "month" },
    { name: "یک‌ساله", durationValue: 1, durationUnit: "year" },
  ],
  cancellation_reasons: named(
    ["تغییر برنامه زمانی", "SCHEDULE_CHANGE"],
    ["مشکل سلامتی", "HEALTH_ISSUE"],
    ["عدم رضایت", "DISSATISFIED"],
  ),
  discount_categories: named(
    ["کاربر جدید", "NEW_USER"],
    ["مناسبتی", "SEASONAL"],
    ["وفاداری", "LOYALTY"],
  ),
  invoice_item_types: named(
    ["هزینه عضویت", "MEMBERSHIP"],
    ["رزرو کلاس", "CLASS_BOOKING"],
    ["خدمات مربی", "COACH_SERVICE"],
  ),
  refund_reasons: named(
    ["لغو توسط باشگاه", "CLUB_CANCELLED"],
    ["پرداخت تکراری", "DUPLICATE_PAYMENT"],
    ["خطای سیستمی", "SYSTEM_ERROR"],
  ),
};
