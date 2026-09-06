export type ServerResourceField = {
  name: string;
  kind:
    | "text"
    | "textarea"
    | "url"
    | "number"
    | "date"
    | "string-list"
    | "relation"
    | "relation-list"
    | "enum";
  required?: boolean;
  options?: readonly string[];
  target?: { category: string; resource: string };
};

export type ServerResourceDefinition = {
  key: string;
  category: string;
  segment: string;
  collection: string;
  primaryField: string;
  specialized: boolean;
  fields: readonly ServerResourceField[];
};

type Row = readonly [
  category: string,
  segment: string,
  collection: string,
  key: string,
];
const rows: readonly Row[] = [
  ["sports", "sport", "sports", "sports"],
  ["sports", "sport-category", "sport_categories", "sport_categories"],
  ["sports", "club-type", "club_types", "club_types"],
  ["sports", "coach-type", "coach_types", "coach_types"],
  ["sports", "class-type", "class_types", "class_types"],
  ["sports", "court-type", "court_types", "court_types"],
  ["sports", "coach-specialty", "coach_specialties", "coach_specialties"],
  ["sports", "skill-level", "skill_levels", "skill_levels"],
  ["clubs", "tag", "club_tags", "club_tags"],
  ["clubs", "review-criterion", "club_review_criteria", "club_review_criteria"],
  ["facilities", "amenity", "amenities", "amenities"],
  ["facilities", "equipment", "equipment", "equipment"],
  [
    "facilities",
    "amenity-category",
    "amenity_categories",
    "amenity_categories",
  ],
  [
    "facilities",
    "equipment-category",
    "equipment_categories",
    "equipment_categories",
  ],
  [
    "facilities",
    "court-surface-type",
    "court_surface_types",
    "court_surface_types",
  ],
  [
    "facilities",
    "court-feature-type",
    "court_feature_types",
    "court_feature_types",
  ],
  ["facilities", "service-type", "service_types", "service_types"],
  ["facilities", "roof-type", "roof_types", "roof_types"],
  ["facilities", "lighting-type", "lighting_types", "lighting_types"],
  [
    "facilities",
    "water-treatment-type",
    "water_treatment_types",
    "water_treatment_types",
  ],
  ["facilities", "ventilation-type", "ventilation_types", "ventilation_types"],
  ["facilities", "cooling-type", "cooling_types", "cooling_types"],
  ["facilities", "parking-type", "parking_types", "parking_types"],
  [
    "facilities",
    "accessibility-type",
    "accessibility_types",
    "accessibility_types",
  ],
  ["location", "country", "countries", "countries"],
  ["location", "province", "provinces", "provinces"],
  ["location", "city", "cities", "cities"],
  ["location", "district", "districts", "districts"],
  ["location", "neighborhood", "neighborhoods", "neighborhoods"],
  ["location", "city-region", "city_regions", "city_regions"],
  ["classes", "goal-type", "class_goal_types", "class_goal_types"],
  [
    "classes",
    "intensity-level",
    "class_intensity_levels",
    "class_intensity_levels",
  ],
  ["classes", "skill-level", "class_skill_levels", "class_skill_levels"],
  ["classes", "format-type", "class_format_types", "class_format_types"],
  [
    "classes",
    "required-item-type",
    "required_item_types",
    "required_item_types",
  ],
  ["classes", "age-group", "age_group_presets", "age_group_presets"],
  ["content", "article-category", "article_categories", "article_categories"],
  ["content", "article-type", "article_types", "article_types"],
  ["content", "article-tag", "article_tags", "article_tags"],
  ["content", "faq-category", "faq_categories", "faq_categories"],
  ["content", "page-type", "page_types", "page_types"],
  ["content", "banner-type", "banner_types", "banner_types"],
  ["content", "banner-position", "banner_positions", "banner_positions"],
  [
    "content",
    "notification-category",
    "notification_categories",
    "notification_categories",
  ],
  [
    "content",
    "featured-collection-type",
    "featured_collection_types",
    "featured_collection_types",
  ],
  [
    "moderation",
    "verification-document-type",
    "verification_document_types",
    "verification_document_types",
  ],
  [
    "moderation",
    "club-rejection-reason",
    "club_rejection_reasons",
    "club_rejection_reasons",
  ],
  [
    "moderation",
    "coach-rejection-reason",
    "coach_rejection_reasons",
    "coach_rejection_reasons",
  ],
  ["moderation", "report-reason", "report_reasons", "report_reasons"],
  [
    "moderation",
    "review-report-reason",
    "review_report_reasons",
    "review_report_reasons",
  ],
  [
    "moderation",
    "suspension-reason",
    "suspension_reasons",
    "suspension_reasons",
  ],
  [
    "moderation",
    "support-ticket-category",
    "support_ticket_categories",
    "support_ticket_categories",
  ],
  ["discovery", "badge-type", "badge_types", "badge_types"],
  [
    "discovery",
    "featured-collection",
    "featured_collections",
    "featured_collections",
  ],
  ["discovery", "search-keyword", "search_keywords", "search_keywords"],
  ["discovery", "search-synonym", "search_synonyms", "search_synonyms"],
  ["discovery", "popular-search", "popular_searches", "popular_searches"],
  ["discovery", "section", "discovery_sections", "discovery_sections"],
  [
    "commerce",
    "membership-plan-type",
    "membership_plan_types",
    "membership_plan_types",
  ],
  ["commerce", "pricing-model", "pricing_models", "pricing_models"],
  [
    "commerce",
    "subscription-period",
    "subscription_periods",
    "subscription_periods",
  ],
  [
    "commerce",
    "cancellation-reason",
    "cancellation_reasons",
    "cancellation_reasons",
  ],
  [
    "commerce",
    "discount-category",
    "discount_categories",
    "discount_categories",
  ],
  ["commerce", "invoice-item-type", "invoice_item_types", "invoice_item_types"],
  ["commerce", "refund-reason", "refund_reasons", "refund_reasons"],
];

const relation = (
  name: string,
  category: string,
  resource: string,
  required = false,
  multiple = false,
): ServerResourceField => ({
  name,
  kind: multiple ? "relation-list" : "relation",
  target: { category, resource },
  required,
});

const extraFields: Record<string, readonly ServerResourceField[]> = {
  sports: [relation("categoryId", "sports", "sport-category")],
  court_types: [relation("supportedSportIds", "sports", "sport", false, true)],
  coach_specialties: [relation("sportIds", "sports", "sport", false, true)],
  amenities: [relation("categoryId", "facilities", "amenity-category")],
  equipment: [
    relation("categoryId", "facilities", "equipment-category"),
    relation("sportIds", "sports", "sport", false, true),
  ],
  provinces: [relation("countryId", "location", "country", true)],
  cities: [relation("provinceId", "location", "province", true)],
  districts: [relation("cityId", "location", "city", true)],
  neighborhoods: [relation("districtId", "location", "district", true)],
  city_regions: [relation("cityId", "location", "city", true)],
  class_goal_types: [relation("sportIds", "sports", "sport", false, true)],
  required_item_types: [relation("sportIds", "sports", "sport", false, true)],
  age_group_presets: [
    { name: "minAge", kind: "number", required: true },
    { name: "maxAge", kind: "number", required: true },
  ],
  badge_types: [{ name: "color", kind: "text" }],
  featured_collections: [
    { name: "title", kind: "text", required: true },
    relation("typeId", "content", "featured-collection-type", true),
    { name: "entityType", kind: "text", required: true },
    { name: "itemIds", kind: "string-list" },
    { name: "startsAt", kind: "date" },
    { name: "endsAt", kind: "date" },
  ],
  search_synonyms: [
    { name: "canonicalTerm", kind: "text", required: true },
    { name: "synonyms", kind: "string-list", required: true },
  ],
  popular_searches: [
    { name: "phrase", kind: "text", required: true },
    { name: "weight", kind: "number", required: true },
    relation("cityId", "location", "city"),
    { name: "startsAt", kind: "date" },
    { name: "endsAt", kind: "date" },
  ],
  discovery_sections: [
    { name: "title", kind: "text", required: true },
    { name: "entityType", kind: "text", required: true },
    relation("collectionId", "discovery", "featured-collection", true),
    { name: "placement", kind: "text", required: true },
    { name: "displayLimit", kind: "number", required: true },
  ],
  pricing_models: [{ name: "billingUnit", kind: "text", required: true }],
  subscription_periods: [
    { name: "durationValue", kind: "number", required: true },
    {
      name: "durationUnit",
      kind: "enum",
      required: true,
      options: ["day", "week", "month", "year"],
    },
  ],
};

const primaryFields: Record<string, string> = {
  featured_collections: "title",
  search_synonyms: "canonicalTerm",
  popular_searches: "phrase",
  discovery_sections: "title",
};
const specialized = new Set([
  "club_tags",
  "age_group_presets",
  "search_synonyms",
  "popular_searches",
  "badge_types",
  "featured_collections",
  "discovery_sections",
  "subscription_periods",
  "pricing_models",
]);

export const serverResourceDefinitions: readonly ServerResourceDefinition[] =
  rows.map(([category, segment, collection, key]) => ({
    key,
    category,
    segment,
    collection,
    primaryField: primaryFields[key] ?? "name",
    specialized: specialized.has(key),
    fields: extraFields[key] ?? [],
  }));

export function getServerResource(
  category: string,
  segment: string,
): ServerResourceDefinition | undefined {
  return serverResourceDefinitions.find(
    (item) =>
      (item.category === category && item.segment === segment) ||
      (resourceDomain(item) === category && item.key === segment),
  );
}

export function resourceDomain(definition: ServerResourceDefinition): string {
  return definition.category === "location" ? "geography" : definition.category;
}

export function resourcePath(definition: ServerResourceDefinition): string {
  return `${resourceDomain(definition)}/${definition.key}`;
}
