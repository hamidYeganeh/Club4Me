import type { ResourceSeedRecord } from "./resources.seed-data";

// Stable seed codes: append entries without renumbering existing codes.
export const iranResourceSeedData: Readonly<
  Record<string, readonly ResourceSeedRecord[]>
> = {
  roof_types: [
    {
      name: "روباز",
      code: "IR_ROOF_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "سقف ثابت",
      code: "IR_ROOF_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "سقف متحرک",
      code: "IR_ROOF_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "نیمه‌مسقف",
      code: "IR_ROOF_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "سقف پارچه‌ای",
      code: "IR_ROOF_TYPES_5",
      sortOrder: 104,
    },
    {
      name: "سقف سوله‌ای",
      code: "IR_ROOF_TYPES_6",
      sortOrder: 105,
    },
    {
      name: "سقف شیشه‌ای",
      code: "IR_ROOF_TYPES_7",
      sortOrder: 106,
    },
  ],
  lighting_types: [
    {
      name: "نور طبیعی",
      code: "IR_LIGHTING_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "پروژکتور LED",
      code: "IR_LIGHTING_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "نور ترکیبی طبیعی و مصنوعی",
      code: "IR_LIGHTING_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "روشنایی سقفی LED",
      code: "IR_LIGHTING_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "فاقد روشنایی شب",
      code: "IR_LIGHTING_TYPES_5",
      sortOrder: 104,
    },
  ],
  water_treatment_types: [
    {
      name: "فیلتراسیون شنی و کلرزنی",
      code: "IR_WATER_TREATMENT_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "فیلتراسیون کارتریجی و کلرزنی",
      code: "IR_WATER_TREATMENT_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "ازن با ضدعفونی مکمل",
      code: "IR_WATER_TREATMENT_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "UV با ضدعفونی مکمل",
      code: "IR_WATER_TREATMENT_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "الکترولیز نمک",
      code: "IR_WATER_TREATMENT_TYPES_5",
      sortOrder: 104,
    },
  ],
  ventilation_types: [
    {
      name: "تهویه طبیعی",
      code: "IR_VENTILATION_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "هواساز مرکزی",
      code: "IR_VENTILATION_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "اگزاست‌فن",
      code: "IR_VENTILATION_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "تهویه ترکیبی",
      code: "IR_VENTILATION_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "تهویه مستقل هر سالن",
      code: "IR_VENTILATION_TYPES_5",
      sortOrder: 104,
    },
  ],
  cooling_types: [
    {
      name: "کولر آبی",
      code: "IR_COOLING_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "اسپلیت",
      code: "IR_COOLING_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "داکت اسپلیت",
      code: "IR_COOLING_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "چیلر و فن‌کویل",
      code: "IR_COOLING_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "سیستم VRF",
      code: "IR_COOLING_TYPES_5",
      sortOrder: 104,
    },
    {
      name: "فاقد سرمایش",
      code: "IR_COOLING_TYPES_6",
      sortOrder: 105,
    },
  ],
  parking_types: [
    {
      name: "پارکینگ اختصاصی رایگان",
      code: "IR_PARKING_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "پارکینگ اختصاصی با هزینه",
      code: "IR_PARKING_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "پارکینگ عمومی نزدیک",
      code: "IR_PARKING_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "پارک حاشیه خیابان",
      code: "IR_PARKING_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "جای پارک موتورسیکلت",
      code: "IR_PARKING_TYPES_5",
      sortOrder: 104,
    },
    {
      name: "فاقد پارکینگ",
      code: "IR_PARKING_TYPES_6",
      sortOrder: 105,
    },
  ],
  accessibility_types: [
    {
      name: "دسترسی کامل با ویلچر",
      code: "IR_ACCESSIBILITY_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "دسترسی به بخشی از مجموعه",
      code: "IR_ACCESSIBILITY_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "ورودی رمپ‌دار",
      code: "IR_ACCESSIBILITY_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "آسانسور مناسب ویلچر",
      code: "IR_ACCESSIBILITY_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "فاقد دسترسی مناسب ویلچر",
      code: "IR_ACCESSIBILITY_TYPES_5",
      sortOrder: 104,
    },
  ],
  court_surface_types: [
    {
      name: "چمن مصنوعی مخصوص پدل",
      code: "IR_COURT_SURFACE_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "موکت ورزشی",
      code: "IR_COURT_SURFACE_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "کف‌پوش گرانولی",
      code: "IR_COURT_SURFACE_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "کف‌پوش PVC ورزشی",
      code: "IR_COURT_SURFACE_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "کف‌پوش پلی‌یورتان",
      code: "IR_COURT_SURFACE_TYPES_5",
      sortOrder: 104,
    },
    {
      name: "تاتامی",
      code: "IR_COURT_SURFACE_TYPES_6",
      sortOrder: 105,
    },
    {
      name: "کف‌پوش لاستیکی وزنه‌برداری",
      code: "IR_COURT_SURFACE_TYPES_7",
      sortOrder: 106,
    },
    {
      name: "ماسه ساحلی",
      code: "IR_COURT_SURFACE_TYPES_8",
      sortOrder: 107,
    },
    {
      name: "سرامیک ضدلغزش محوطه استخر",
      code: "IR_COURT_SURFACE_TYPES_9",
      sortOrder: 108,
    },
  ],
  club_review_criteria: [
    {
      name: "کیفیت تجهیزات",
      code: "IR_CLUB_REVIEW_CRITERIA_1",
      sortOrder: 100,
    },
    {
      name: "نظافت",
      code: "IR_CLUB_REVIEW_CRITERIA_2",
      sortOrder: 101,
    },
    {
      name: "برخورد کارکنان",
      code: "IR_CLUB_REVIEW_CRITERIA_3",
      sortOrder: 102,
    },
    {
      name: "کیفیت مربی",
      code: "IR_CLUB_REVIEW_CRITERIA_4",
      sortOrder: 103,
    },
    {
      name: "ارزش نسبت به قیمت",
      code: "IR_CLUB_REVIEW_CRITERIA_5",
      sortOrder: 104,
    },
    {
      name: "تهویه و دمای محیط",
      code: "IR_CLUB_REVIEW_CRITERIA_6",
      sortOrder: 105,
    },
    {
      name: "دقت برنامه زمانی",
      code: "IR_CLUB_REVIEW_CRITERIA_7",
      sortOrder: 106,
    },
    {
      name: "کیفیت رختکن",
      code: "IR_CLUB_REVIEW_CRITERIA_8",
      sortOrder: 107,
    },
  ],
  club_tags: [
    {
      name: "نزدیک مترو",
      code: "IR_CLUB_TAGS_1",
      sortOrder: 100,
    },
    {
      name: "مناسب شروع ورزش",
      code: "IR_CLUB_TAGS_2",
      sortOrder: 101,
    },
    {
      name: "امکان جلسه آزمایشی",
      code: "IR_CLUB_TAGS_3",
      sortOrder: 102,
    },
    {
      name: "سانس صبحگاهی",
      code: "IR_CLUB_TAGS_4",
      sortOrder: 103,
    },
    {
      name: "سانس آخر شب",
      code: "IR_CLUB_TAGS_5",
      sortOrder: 104,
    },
    {
      name: "مناسب تمرین خانوادگی",
      code: "IR_CLUB_TAGS_6",
      sortOrder: 105,
    },
  ],
  coach_types: [
    {
      name: "مربی آمادگی جسمانی",
      code: "IR_COACH_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "مربی ورزش همگانی",
      code: "IR_COACH_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "مربی ورزش کودکان",
      code: "IR_COACH_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "مربی ورزش سالمندان",
      code: "IR_COACH_TYPES_4",
      sortOrder: 103,
    },
  ],
  court_types: [
    {
      name: "زمین والیبال ساحلی",
      code: "IR_COURT_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "زمین بسکتبال سه‌نفره",
      code: "IR_COURT_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "سالن چندمنظوره مدارس",
      code: "IR_COURT_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "پیست اسکیت سرپوشیده",
      code: "IR_COURT_TYPES_4",
      sortOrder: 103,
    },
  ],
  service_types: [
    {
      name: "اجاره راکت پدل",
      code: "IR_SERVICE_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "اجاره راکت تنیس",
      code: "IR_SERVICE_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "اجاره کمد روزانه",
      code: "IR_SERVICE_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "اجاره کمد ماهانه",
      code: "IR_SERVICE_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "بازدید پیش از ثبت‌نام",
      code: "IR_SERVICE_TYPES_5",
      sortOrder: 104,
    },
    {
      name: "نگهداری وسایل ورزشی",
      code: "IR_SERVICE_TYPES_6",
      sortOrder: 105,
    },
  ],
  required_item_types: [
    {
      name: "کفش مخصوص سالن با زیره تمیز",
      code: "IR_REQUIRED_ITEM_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "حوله شخصی",
      code: "IR_REQUIRED_ITEM_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "بطری آب شخصی",
      code: "IR_REQUIRED_ITEM_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "دمپایی استخری",
      code: "IR_REQUIRED_ITEM_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "کلاه شنا",
      code: "IR_REQUIRED_ITEM_TYPES_5",
      sortOrder: 104,
    },
    {
      name: "قفل کمد",
      code: "IR_REQUIRED_ITEM_TYPES_6",
      sortOrder: 105,
    },
    {
      name: "راکت شخصی",
      code: "IR_REQUIRED_ITEM_TYPES_7",
      sortOrder: 106,
    },
    {
      name: "مت یوگا",
      code: "IR_REQUIRED_ITEM_TYPES_8",
      sortOrder: 107,
    },
    {
      name: "کارت شناسایی",
      code: "IR_REQUIRED_ITEM_TYPES_9",
      sortOrder: 108,
    },
  ],
  class_goal_types: [
    {
      name: "آمادگی آزمون ورزشی",
      code: "IR_CLASS_GOAL_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "یادگیری اصول حرکت",
      code: "IR_CLASS_GOAL_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "بازگشت تدریجی به تمرین",
      code: "IR_CLASS_GOAL_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "افزایش تعادل",
      code: "IR_CLASS_GOAL_TYPES_4",
      sortOrder: 103,
    },
    {
      name: "آمادگی کوه‌پیمایی",
      code: "IR_CLASS_GOAL_TYPES_5",
      sortOrder: 104,
    },
  ],
  class_format_types: [
    {
      name: "نیمه‌خصوصی دونفره",
      code: "IR_CLASS_FORMAT_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "تمرین خانوادگی",
      code: "IR_CLASS_FORMAT_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "دوره فشرده آخر هفته",
      code: "IR_CLASS_FORMAT_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "کلاس ترکیبی حضوری و آنلاین",
      code: "IR_CLASS_FORMAT_TYPES_4",
      sortOrder: 103,
    },
  ],
  article_categories: [
    {
      name: "راهنمای انتخاب باشگاه",
      code: "IR_ARTICLE_CATEGORIES_1",
      sortOrder: 100,
    },
    {
      name: "ورزش در خانه",
      code: "IR_ARTICLE_CATEGORIES_2",
      sortOrder: 101,
    },
    {
      name: "ورزش کودکان و خانواده",
      code: "IR_ARTICLE_CATEGORIES_3",
      sortOrder: 102,
    },
    {
      name: "ورزش در سفر",
      code: "IR_ARTICLE_CATEGORIES_4",
      sortOrder: 103,
    },
  ],
  article_tags: [
    {
      name: "ورزش در نوروز",
      code: "IR_ARTICLE_TAGS_1",
      sortOrder: 100,
    },
    {
      name: "تمرین تابستانی",
      code: "IR_ARTICLE_TAGS_2",
      sortOrder: 101,
    },
    {
      name: "باشگاه بانوان",
      code: "IR_ARTICLE_TAGS_3",
      sortOrder: 102,
    },
    {
      name: "راهنمای جلسه اول",
      code: "IR_ARTICLE_TAGS_4",
      sortOrder: 103,
    },
    {
      name: "ورزش دانشجویی",
      code: "IR_ARTICLE_TAGS_5",
      sortOrder: 104,
    },
  ],
  faq_categories: [
    {
      name: "جلسه آزمایشی رایگان",
      code: "IR_FAQ_CATEGORIES_1",
      sortOrder: 100,
    },
    {
      name: "امکانات و دسترسی باشگاه",
      code: "IR_FAQ_CATEGORIES_2",
      sortOrder: 101,
    },
    {
      name: "سانس بانوان و آقایان",
      code: "IR_FAQ_CATEGORIES_3",
      sortOrder: 102,
    },
    {
      name: "مدارک مربی",
      code: "IR_FAQ_CATEGORIES_4",
      sortOrder: 103,
    },
  ],
  club_rejection_reasons: [
    {
      name: "عدم تطابق نام و نشانی باشگاه",
      code: "IR_CLUB_REJECTION_REASONS_1",
      sortOrder: 100,
    },
    {
      name: "تصاویر مربوط به مجموعه دیگری است",
      code: "IR_CLUB_REJECTION_REASONS_2",
      sortOrder: 101,
    },
    {
      name: "مشخصات فضاهای ورزشی ناقص است",
      code: "IR_CLUB_REJECTION_REASONS_3",
      sortOrder: 102,
    },
  ],
  coach_rejection_reasons: [
    {
      name: "عدم تطابق رشته و مدرک ارائه‌شده",
      code: "IR_COACH_REJECTION_REASONS_1",
      sortOrder: 100,
    },
    {
      name: "تصویر مدرک ناخوانا است",
      code: "IR_COACH_REJECTION_REASONS_2",
      sortOrder: 101,
    },
  ],
  support_ticket_categories: [
    {
      name: "مشکل رزرو آزمایشی",
      code: "IR_SUPPORT_TICKET_CATEGORIES_1",
      sortOrder: 100,
    },
    {
      name: "مغایرت امکانات اعلام‌شده",
      code: "IR_SUPPORT_TICKET_CATEGORIES_2",
      sortOrder: 101,
    },
    {
      name: "اصلاح موقعیت روی نقشه",
      code: "IR_SUPPORT_TICKET_CATEGORIES_3",
      sortOrder: 102,
    },
    {
      name: "مشکل دسترسی به کد پیامکی",
      code: "IR_SUPPORT_TICKET_CATEGORIES_4",
      sortOrder: 103,
    },
  ],
  search_keywords: [
    {
      name: "رزرو پدل",
      code: "IR_SEARCH_KEYWORDS_1",
      sortOrder: 100,
    },
    {
      name: "استخر بانوان",
      code: "IR_SEARCH_KEYWORDS_2",
      sortOrder: 101,
    },
    {
      name: "باشگاه نزدیک مترو",
      code: "IR_SEARCH_KEYWORDS_3",
      sortOrder: 102,
    },
    {
      name: "کلاس شنا کودکان",
      code: "IR_SEARCH_KEYWORDS_4",
      sortOrder: 103,
    },
    {
      name: "باشگاه با جلسه آزمایشی",
      code: "IR_SEARCH_KEYWORDS_5",
      sortOrder: 104,
    },
    {
      name: "زمین تنیس روباز",
      code: "IR_SEARCH_KEYWORDS_6",
      sortOrder: 105,
    },
  ],
  membership_plan_types: [
    {
      name: "عضویت سانس صبح",
      code: "IR_MEMBERSHIP_PLAN_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "عضویت دانشجویی",
      code: "IR_MEMBERSHIP_PLAN_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "عضویت خانوادگی",
      code: "IR_MEMBERSHIP_PLAN_TYPES_3",
      sortOrder: 102,
    },
    {
      name: "عضویت سازمانی",
      code: "IR_MEMBERSHIP_PLAN_TYPES_4",
      sortOrder: 103,
    },
  ],
  discount_categories: [
    {
      name: "تخفیف نوروز",
      code: "IR_DISCOUNT_CATEGORIES_1",
      sortOrder: 100,
    },
    {
      name: "تخفیف دانشجویی",
      code: "IR_DISCOUNT_CATEGORIES_2",
      sortOrder: 101,
    },
    {
      name: "تخفیف ساعات خلوت",
      code: "IR_DISCOUNT_CATEGORIES_3",
      sortOrder: 102,
    },
    {
      name: "تخفیف معرفی دوست",
      code: "IR_DISCOUNT_CATEGORIES_4",
      sortOrder: 103,
    },
  ],
  invoice_item_types: [
    {
      name: "اجاره تجهیزات ورزشی",
      code: "IR_INVOICE_ITEM_TYPES_1",
      sortOrder: 100,
    },
    {
      name: "هزینه کمد اختصاصی",
      code: "IR_INVOICE_ITEM_TYPES_2",
      sortOrder: 101,
    },
    {
      name: "جلسه آزمایشی رایگان",
      code: "IR_INVOICE_ITEM_TYPES_3",
      sortOrder: 102,
    },
  ],
  refund_reasons: [
    {
      name: "تعطیلی اعلام‌نشده مجموعه",
      code: "IR_REFUND_REASONS_1",
      sortOrder: 100,
    },
    {
      name: "عدم حضور مربی",
      code: "IR_REFUND_REASONS_2",
      sortOrder: 101,
    },
    {
      name: "مغایرت خدمات با رزرو",
      code: "IR_REFUND_REASONS_3",
      sortOrder: 102,
    },
    {
      name: "پرداخت تکراری",
      code: "IR_REFUND_REASONS_4",
      sortOrder: 103,
    },
  ],
  provinces: [
    {
      name: "آذربایجان غربی",
      code: "WEST_AZERBAIJAN",
      slug: "west-azerbaijan",
      countryId: "@IR",
    },
    {
      name: "اردبیل",
      code: "ARDABIL",
      slug: "ardabil",
      countryId: "@IR",
    },
    {
      name: "ایلام",
      code: "ILAM",
      slug: "ilam",
      countryId: "@IR",
    },
    {
      name: "بوشهر",
      code: "BUSHEHR",
      slug: "bushehr",
      countryId: "@IR",
    },
    {
      name: "چهارمحال و بختیاری",
      code: "CHAHARMAHAL_BAKHTIARI",
      slug: "chaharmahal-bakhtiari",
      countryId: "@IR",
    },
    {
      name: "خراسان جنوبی",
      code: "SOUTH_KHORASAN",
      slug: "south-khorasan",
      countryId: "@IR",
    },
    {
      name: "خراسان شمالی",
      code: "NORTH_KHORASAN",
      slug: "north-khorasan",
      countryId: "@IR",
    },
    {
      name: "زنجان",
      code: "ZANJAN",
      slug: "zanjan",
      countryId: "@IR",
    },
    {
      name: "سمنان",
      code: "SEMNAN",
      slug: "semnan",
      countryId: "@IR",
    },
    {
      name: "سیستان و بلوچستان",
      code: "SISTAN_BALUCHESTAN",
      slug: "sistan-baluchestan",
      countryId: "@IR",
    },
    {
      name: "قزوین",
      code: "QAZVIN",
      slug: "qazvin",
      countryId: "@IR",
    },
    {
      name: "کردستان",
      code: "KURDISTAN",
      slug: "kurdistan",
      countryId: "@IR",
    },
    {
      name: "کرمانشاه",
      code: "KERMANSHAH",
      slug: "kermanshah",
      countryId: "@IR",
    },
    {
      name: "کهگیلویه و بویراحمد",
      code: "KOHGILUYEH_BOYERAHMAD",
      slug: "kohgiluyeh-boyerahmad",
      countryId: "@IR",
    },
    {
      name: "گلستان",
      code: "GOLESTAN",
      slug: "golestan",
      countryId: "@IR",
    },
    {
      name: "لرستان",
      code: "LORESTAN",
      slug: "lorestan",
      countryId: "@IR",
    },
    {
      name: "مرکزی",
      code: "MARKAZI",
      slug: "markazi",
      countryId: "@IR",
    },
    {
      name: "همدان",
      code: "HAMADAN",
      slug: "hamadan",
      countryId: "@IR",
    },
  ],
  cities: [
    {
      name: "ارومیه",
      code: "URMIA",
      slug: "urmia",
      provinceId: "@WEST_AZERBAIJAN",
    },
    {
      name: "اردبیل",
      code: "ARDABIL_CITY",
      slug: "ardabil-city",
      provinceId: "@ARDABIL",
    },
    {
      name: "ایلام",
      code: "ILAM_CITY",
      slug: "ilam-city",
      provinceId: "@ILAM",
    },
    {
      name: "بوشهر",
      code: "BUSHEHR_CITY",
      slug: "bushehr-city",
      provinceId: "@BUSHEHR",
    },
    {
      name: "شهرکرد",
      code: "SHAHREKORD",
      slug: "shahrekord",
      provinceId: "@CHAHARMAHAL_BAKHTIARI",
    },
    {
      name: "بیرجند",
      code: "BIRJAND",
      slug: "birjand",
      provinceId: "@SOUTH_KHORASAN",
    },
    {
      name: "بجنورد",
      code: "BOJNURD",
      slug: "bojnurd",
      provinceId: "@NORTH_KHORASAN",
    },
    {
      name: "زنجان",
      code: "ZANJAN_CITY",
      slug: "zanjan-city",
      provinceId: "@ZANJAN",
    },
    {
      name: "سمنان",
      code: "SEMNAN_CITY",
      slug: "semnan-city",
      provinceId: "@SEMNAN",
    },
    {
      name: "زاهدان",
      code: "ZAHEDAN",
      slug: "zahedan",
      provinceId: "@SISTAN_BALUCHESTAN",
    },
    {
      name: "قزوین",
      code: "QAZVIN_CITY",
      slug: "qazvin-city",
      provinceId: "@QAZVIN",
    },
    {
      name: "سنندج",
      code: "SANANDAJ",
      slug: "sanandaj",
      provinceId: "@KURDISTAN",
    },
    {
      name: "کرمانشاه",
      code: "KERMANSHAH_CITY",
      slug: "kermanshah-city",
      provinceId: "@KERMANSHAH",
    },
    {
      name: "یاسوج",
      code: "YASUJ",
      slug: "yasuj",
      provinceId: "@KOHGILUYEH_BOYERAHMAD",
    },
    {
      name: "گرگان",
      code: "GORGAN",
      slug: "gorgan",
      provinceId: "@GOLESTAN",
    },
    {
      name: "خرم‌آباد",
      code: "KHORRAMABAD",
      slug: "khorramabad",
      provinceId: "@LORESTAN",
    },
    {
      name: "اراک",
      code: "ARAK",
      slug: "arak",
      provinceId: "@MARKAZI",
    },
    {
      name: "همدان",
      code: "HAMADAN_CITY",
      slug: "hamadan-city",
      provinceId: "@HAMADAN",
    },
  ],
  search_synonyms: [
    {
      canonicalTerm: "پدل",
      synonyms: ["پادل", "padel"],
    },
    {
      canonicalTerm: "پیلاتس",
      synonyms: ["پيلاتس", "pilates"],
    },
    {
      canonicalTerm: "کف‌پوش",
      synonyms: ["کفپوش", "کف پوش"],
    },
  ],
};
