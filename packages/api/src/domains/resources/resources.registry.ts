export type ResourceFieldKind =
  | "text"
  | "textarea"
  | "url"
  | "number"
  | "date"
  | "string-list"
  | "relation"
  | "relation-list"
  | "enum";

export type ResourceFieldDefinition = {
  name: string;
  label: string;
  kind: ResourceFieldKind;
  required?: boolean;
  immutable?: boolean;
  options?: readonly string[];
  relation?: { category: string; resource: string };
};

export type ResourceDefinition = {
  key: string;
  segment: string;
  collection: string;
  label: string;
  description: string;
  permission: string;
  fields?: readonly ResourceFieldDefinition[];
};

export type ResourceGroup = {
  id: string;
  segment: string;
  title: string;
  priority: "P0" | "P1" | "P2";
  items: readonly ResourceDefinition[];
};

const relation = (
  name: string,
  label: string,
  category: string,
  resource: string,
  multiple = false,
  required = false,
): ResourceFieldDefinition => ({
  name,
  label,
  kind: multiple ? "relation-list" : "relation",
  relation: { category, resource },
  required,
});

const resource = (
  key: string,
  segment: string,
  collection: string,
  label: string,
  description: string,
  fields?: readonly ResourceFieldDefinition[],
): ResourceDefinition => ({
  key,
  segment,
  collection,
  label,
  description,
  permission: `resources.${key}.manage`,
  ...(fields ? { fields } : {}),
});

export const resourceGroups = [
  {
    id: "sports",
    segment: "sports",
    title: "اطلاعات ورزشی",
    priority: "P0",
    items: [
      resource(
        "sports",
        "sport",
        "sports",
        "رشته‌های ورزشی",
        "مدیریت رشته‌های ورزشی",
        [relation("categoryId", "دسته‌بندی", "sports", "sport-category")],
      ),
      resource(
        "sport_categories",
        "sport-category",
        "sport_categories",
        "دسته‌بندی رشته‌ها",
        "مدیریت دسته‌بندی رشته‌های ورزشی",
      ),
      resource(
        "club_types",
        "club-type",
        "club_types",
        "انواع باشگاه",
        "مدیریت انواع باشگاه",
      ),
      resource(
        "coach_types",
        "coach-type",
        "coach_types",
        "انواع مربی",
        "مدیریت انواع مربی",
      ),
      resource(
        "class_types",
        "class-type",
        "class_types",
        "انواع کلاس",
        "مدیریت انواع کلاس",
      ),
      resource(
        "court_types",
        "court-type",
        "court_types",
        "انواع زمین و سالن",
        "مدیریت انواع زمین و سالن",
        [
          relation(
            "supportedSportIds",
            "رشته‌های پشتیبانی‌شده",
            "sports",
            "sport",
            true,
          ),
        ],
      ),
      resource(
        "coach_specialties",
        "coach-specialty",
        "coach_specialties",
        "تخصص‌های مربی",
        "مدیریت تخصص‌های مربیان",
        [relation("sportIds", "رشته‌های ورزشی", "sports", "sport", true)],
      ),
      resource(
        "skill_levels",
        "skill-level",
        "skill_levels",
        "سطوح مهارت",
        "مدیریت سطوح مهارت",
      ),
    ],
  },
  {
    id: "clubs",
    segment: "clubs",
    title: "اطلاعات باشگاه",
    priority: "P0",
    items: [
      resource(
        "club_review_criteria",
        "review-criterion",
        "club_review_criteria",
        "معیارهای نظر‌دهی باشگاه",
        "تعریف، ترتیب و فعال‌سازی معیارهای امتیازدهی باشگاه",
      ),
      resource(
        "club_tags",
        "tag",
        "club_tags",
        "برچسب‌های باشگاه",
        "مدیریت برچسب‌های قابل انتخاب برای باشگاه‌ها",
      ),
    ],
  },
  {
    id: "facilities",
    segment: "facilities",
    title: "امکانات و تجهیزات",
    priority: "P0",
    items: [
      resource(
        "roof_types",
        "roof-type",
        "roof_types",
        "انواع سقف",
        "مدیریت نوع سقف و پوشش فضاهای ورزشی",
      ),
      resource(
        "lighting_types",
        "lighting-type",
        "lighting_types",
        "انواع نورپردازی",
        "مدیریت روشنایی زمین، سالن و استخر",
      ),
      resource(
        "water_treatment_types",
        "water-treatment-type",
        "water_treatment_types",
        "روش‌های تصفیه آب",
        "مدیریت روش تصفیه و گندزدایی آب استخر",
      ),
      resource(
        "ventilation_types",
        "ventilation-type",
        "ventilation_types",
        "سیستم‌های تهویه",
        "مدیریت انواع تهویه فضاهای ورزشی",
      ),
      resource(
        "cooling_types",
        "cooling-type",
        "cooling_types",
        "سیستم‌های سرمایش",
        "مدیریت انواع سرمایش باشگاه",
      ),
      resource(
        "parking_types",
        "parking-type",
        "parking_types",
        "انواع پارکینگ",
        "مدیریت وضعیت و نوع پارکینگ",
      ),
      resource(
        "accessibility_types",
        "accessibility-type",
        "accessibility_types",
        "سطوح دسترس‌پذیری",
        "مدیریت دسترسی به فضاهای باشگاه",
      ),
      resource(
        "amenities",
        "amenity",
        "amenities",
        "امکانات",
        "مدیریت امکانات باشگاه",
        [relation("categoryId", "دسته‌بندی", "facilities", "amenity-category")],
      ),
      resource(
        "equipment",
        "equipment",
        "equipment",
        "تجهیزات",
        "مدیریت تجهیزات ورزشی",
        [
          relation(
            "categoryId",
            "دسته‌بندی",
            "facilities",
            "equipment-category",
          ),
          relation("sportIds", "رشته‌های ورزشی", "sports", "sport", true),
        ],
      ),
      resource(
        "amenity_categories",
        "amenity-category",
        "amenity_categories",
        "دسته‌بندی امکانات",
        "مدیریت دسته‌بندی امکانات",
      ),
      resource(
        "equipment_categories",
        "equipment-category",
        "equipment_categories",
        "دسته‌بندی تجهیزات",
        "مدیریت دسته‌بندی تجهیزات",
      ),
      resource(
        "court_surface_types",
        "court-surface-type",
        "court_surface_types",
        "انواع سطح زمین",
        "مدیریت انواع سطح زمین",
      ),
      resource(
        "court_feature_types",
        "court-feature-type",
        "court_feature_types",
        "ویژگی‌های زمین و سالن",
        "مدیریت ویژگی‌های زمین و سالن",
      ),
      resource(
        "service_types",
        "service-type",
        "service_types",
        "انواع خدمات",
        "مدیریت انواع خدمات",
      ),
    ],
  },
  {
    id: "location",
    segment: "location",
    title: "اطلاعات جغرافیایی",
    priority: "P0",
    items: [
      resource("countries", "country", "countries", "کشورها", "مدیریت کشورها"),
      resource(
        "provinces",
        "province",
        "provinces",
        "استان‌ها",
        "مدیریت استان‌ها",
        [relation("countryId", "کشور", "location", "country", false, true)],
      ),
      resource("cities", "city", "cities", "شهرها", "مدیریت شهرها", [
        relation("provinceId", "استان", "location", "province", false, true),
      ]),
      resource(
        "districts",
        "district",
        "districts",
        "مناطق شهری",
        "مدیریت مناطق شهری",
        [relation("cityId", "شهر", "location", "city", false, true)],
      ),
      resource(
        "neighborhoods",
        "neighborhood",
        "neighborhoods",
        "محله‌ها",
        "مدیریت محله‌ها",
        [
          relation(
            "districtId",
            "منطقه شهری",
            "location",
            "district",
            false,
            true,
          ),
        ],
      ),
      resource(
        "city_regions",
        "city-region",
        "city_regions",
        "محدوده‌های شهر",
        "مدیریت محدوده‌های شهر",
        [relation("cityId", "شهر", "location", "city", false, true)],
      ),
    ],
  },
  {
    id: "classes",
    segment: "classes",
    title: "تنظیمات کلاس",
    priority: "P1",
    items: [
      resource(
        "class_goal_types",
        "goal-type",
        "class_goal_types",
        "اهداف کلاس",
        "مدیریت اهداف کلاس",
        [relation("sportIds", "رشته‌های ورزشی", "sports", "sport", true)],
      ),
      resource(
        "class_intensity_levels",
        "intensity-level",
        "class_intensity_levels",
        "سطوح شدت کلاس",
        "مدیریت سطوح شدت کلاس",
      ),
      resource(
        "class_skill_levels",
        "skill-level",
        "class_skill_levels",
        "سطوح مهارت کلاس",
        "مدیریت سطوح مهارت کلاس",
      ),
      resource(
        "class_format_types",
        "format-type",
        "class_format_types",
        "فرمت‌های برگزاری کلاس",
        "مدیریت فرمت‌های کلاس",
      ),
      resource(
        "required_item_types",
        "required-item-type",
        "required_item_types",
        "وسایل موردنیاز",
        "مدیریت وسایل موردنیاز کلاس",
        [relation("sportIds", "رشته‌های ورزشی", "sports", "sport", true)],
      ),
      resource(
        "age_group_presets",
        "age-group",
        "age_group_presets",
        "گروه‌های سنی",
        "مدیریت گروه‌های سنی",
        [
          { name: "minAge", label: "حداقل سن", kind: "number", required: true },
          {
            name: "maxAge",
            label: "حداکثر سن",
            kind: "number",
            required: true,
          },
        ],
      ),
    ],
  },
  {
    id: "content",
    segment: "content",
    title: "محتوا و مجله",
    priority: "P1",
    items: [
      resource(
        "article_categories",
        "article-category",
        "article_categories",
        "دسته‌بندی مقالات",
        "مدیریت دسته‌بندی مقالات",
      ),
      resource(
        "article_types",
        "article-type",
        "article_types",
        "انواع مقاله",
        "مدیریت انواع مقاله",
      ),
      resource(
        "article_tags",
        "article-tag",
        "article_tags",
        "برچسب‌های مقاله",
        "مدیریت برچسب‌های مقاله",
      ),
      resource(
        "faq_categories",
        "faq-category",
        "faq_categories",
        "دسته‌بندی سوالات متداول",
        "مدیریت دسته‌بندی سوالات متداول",
      ),
      resource(
        "page_types",
        "page-type",
        "page_types",
        "انواع صفحه",
        "مدیریت انواع صفحه",
      ),
      resource(
        "banner_types",
        "banner-type",
        "banner_types",
        "انواع بنر",
        "مدیریت انواع بنر",
      ),
      resource(
        "banner_positions",
        "banner-position",
        "banner_positions",
        "جایگاه‌های بنر",
        "مدیریت جایگاه‌های بنر",
      ),
      resource(
        "notification_categories",
        "notification-category",
        "notification_categories",
        "دسته‌بندی اعلان‌ها",
        "مدیریت دسته‌بندی اعلان‌ها",
      ),
      resource(
        "featured_collection_types",
        "featured-collection-type",
        "featured_collection_types",
        "انواع مجموعه منتخب",
        "مدیریت انواع مجموعه منتخب",
      ),
    ],
  },
  {
    id: "moderation",
    segment: "moderation",
    title: "اعتبارسنجی و نظارت",
    priority: "P1",
    items: [
      resource(
        "verification_document_types",
        "verification-document-type",
        "verification_document_types",
        "انواع مدارک اعتبارسنجی",
        "مدیریت مدارک اعتبارسنجی",
      ),
      resource(
        "club_rejection_reasons",
        "club-rejection-reason",
        "club_rejection_reasons",
        "دلایل رد باشگاه",
        "مدیریت دلایل رد باشگاه",
      ),
      resource(
        "coach_rejection_reasons",
        "coach-rejection-reason",
        "coach_rejection_reasons",
        "دلایل رد مربی",
        "مدیریت دلایل رد مربی",
      ),
      resource(
        "report_reasons",
        "report-reason",
        "report_reasons",
        "دلایل گزارش",
        "مدیریت دلایل گزارش",
      ),
      resource(
        "review_report_reasons",
        "review-report-reason",
        "review_report_reasons",
        "دلایل گزارش نظر",
        "مدیریت دلایل گزارش نظر",
      ),
      resource(
        "suspension_reasons",
        "suspension-reason",
        "suspension_reasons",
        "دلایل تعلیق",
        "مدیریت دلایل تعلیق",
      ),
      resource(
        "support_ticket_categories",
        "support-ticket-category",
        "support_ticket_categories",
        "دسته‌بندی تیکت‌ها",
        "مدیریت دسته‌بندی تیکت‌ها",
      ),
    ],
  },
  {
    id: "discovery",
    segment: "discovery",
    title: "کشف و جست‌وجو",
    priority: "P1",
    items: [
      resource(
        "badge_types",
        "badge-type",
        "badge_types",
        "نشان‌ها",
        "مدیریت نشان‌ها",
        [{ name: "color", label: "رنگ", kind: "text" }],
      ),
      resource(
        "featured_collections",
        "featured-collection",
        "featured_collections",
        "مجموعه‌های منتخب",
        "مدیریت مجموعه‌های منتخب",
        [
          { name: "title", label: "عنوان", kind: "text", required: true },
          relation(
            "typeId",
            "نوع مجموعه",
            "content",
            "featured-collection-type",
            false,
            true,
          ),
          {
            name: "entityType",
            label: "نوع محتوا",
            kind: "text",
            required: true,
          },
          { name: "itemIds", label: "شناسه آیتم‌ها", kind: "string-list" },
          { name: "startsAt", label: "شروع نمایش", kind: "date" },
          { name: "endsAt", label: "پایان نمایش", kind: "date" },
        ],
      ),
      resource(
        "search_keywords",
        "search-keyword",
        "search_keywords",
        "کلیدواژه‌های جست‌وجو",
        "مدیریت کلیدواژه‌های جست‌وجو",
      ),
      resource(
        "search_synonyms",
        "search-synonym",
        "search_synonyms",
        "مترادف‌های جست‌وجو",
        "مدیریت مترادف‌های جست‌وجو",
        [
          {
            name: "canonicalTerm",
            label: "عبارت اصلی",
            kind: "text",
            required: true,
          },
          {
            name: "synonyms",
            label: "مترادف‌ها",
            kind: "string-list",
            required: true,
          },
        ],
      ),
      resource(
        "popular_searches",
        "popular-search",
        "popular_searches",
        "جست‌وجوهای محبوب",
        "مدیریت جست‌وجوهای محبوب",
        [
          { name: "phrase", label: "عبارت", kind: "text", required: true },
          { name: "weight", label: "وزن", kind: "number", required: true },
          relation("cityId", "شهر", "location", "city"),
          { name: "startsAt", label: "شروع نمایش", kind: "date" },
          { name: "endsAt", label: "پایان نمایش", kind: "date" },
        ],
      ),
      resource(
        "discovery_sections",
        "section",
        "discovery_sections",
        "بخش‌های صفحه کشف",
        "مدیریت بخش‌های صفحه کشف",
        [
          { name: "title", label: "عنوان", kind: "text", required: true },
          {
            name: "entityType",
            label: "نوع محتوا",
            kind: "text",
            required: true,
          },
          relation(
            "collectionId",
            "مجموعه",
            "discovery",
            "featured-collection",
            false,
            true,
          ),
          { name: "placement", label: "جایگاه", kind: "text", required: true },
          {
            name: "displayLimit",
            label: "حداکثر نمایش",
            kind: "number",
            required: true,
          },
        ],
      ),
    ],
  },
  {
    id: "commerce",
    segment: "commerce",
    title: "رزرو و امور مالی",
    priority: "P2",
    items: [
      resource(
        "membership_plan_types",
        "membership-plan-type",
        "membership_plan_types",
        "انواع عضویت",
        "مدیریت انواع عضویت",
      ),
      resource(
        "pricing_models",
        "pricing-model",
        "pricing_models",
        "مدل‌های قیمت‌گذاری",
        "مدیریت مدل‌های قیمت‌گذاری",
        [
          {
            name: "billingUnit",
            label: "واحد صورتحساب",
            kind: "text",
            required: true,
          },
        ],
      ),
      resource(
        "subscription_periods",
        "subscription-period",
        "subscription_periods",
        "دوره‌های اشتراک",
        "مدیریت دوره‌های اشتراک",
        [
          {
            name: "durationValue",
            label: "مدت",
            kind: "number",
            required: true,
          },
          {
            name: "durationUnit",
            label: "واحد مدت",
            kind: "enum",
            required: true,
            options: ["day", "week", "month", "year"],
          },
        ],
      ),
      resource(
        "cancellation_reasons",
        "cancellation-reason",
        "cancellation_reasons",
        "دلایل لغو",
        "مدیریت دلایل لغو",
      ),
      resource(
        "discount_categories",
        "discount-category",
        "discount_categories",
        "دسته‌بندی تخفیف‌ها",
        "مدیریت دسته‌بندی تخفیف‌ها",
      ),
      resource(
        "invoice_item_types",
        "invoice-item-type",
        "invoice_item_types",
        "انواع آیتم فاکتور",
        "مدیریت انواع آیتم فاکتور",
      ),
      resource(
        "refund_reasons",
        "refund-reason",
        "refund_reasons",
        "دلایل بازپرداخت",
        "مدیریت دلایل بازپرداخت",
      ),
    ],
  },
] as const satisfies readonly ResourceGroup[];

export type ResourceGroupId = (typeof resourceGroups)[number]["id"];
export type ResourceKey =
  (typeof resourceGroups)[number]["items"][number]["key"];

export const resourceDefinitions = resourceGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupId: group.id,
    groupSegment: group.segment,
  })),
);

export function findResourceDefinition(category: string, segment: string) {
  return resourceDefinitions.find(
    (item) =>
      (item.groupSegment === category && item.segment === segment) ||
      ((item.groupSegment === "location" ? "geography" : item.groupSegment) ===
        category &&
        item.key === segment),
  );
}

export const resourcePagePath = (category: string, segment: string) =>
  `/resources/${category}/${segment}` as const;

export const resourceApiPath = (category: string, segment: string) => {
  const definition = findResourceDefinition(category, segment);
  if (!definition) throw new Error(`Unknown resource: ${category}/${segment}`);
  const domain =
    definition.groupSegment === "location"
      ? "geography"
      : definition.groupSegment;
  return `/${domain}/${definition.key}`;
};
