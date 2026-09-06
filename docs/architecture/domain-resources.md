# Admin-managed domain resources

Canonical base: `/api/v1/{domain}/{feature}`. Features use plural snake_case; geography replaces the legacy `location` domain. There are 65 resources across nine domains, with 778 initial records. `GET /api/v1/resources/registry` returns the complete path inventory to administrators.

| Domain     | Features                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sports     | sports, sport_categories, club_types, coach_types, class_types, court_types, coach_specialties, skill_levels                                                                                                                                     |
| clubs      | club_review_criteria, club_tags                                                                                                                                                                                                                  |
| facilities | amenities, equipment, amenity_categories, equipment_categories, court_surface_types, court_feature_types, service_types, roof_types, lighting_types, water_treatment_types, ventilation_types, cooling_types, parking_types, accessibility_types |
| geography  | countries, provinces, cities, districts, neighborhoods, city_regions                                                                                                                                                                             |
| classes    | class_goal_types, class_intensity_levels, class_skill_levels, class_format_types, required_item_types, age_group_presets                                                                                                                         |
| content    | article_categories, article_types, article_tags, faq_categories, page_types, banner_types, banner_positions, notification_categories, featured_collection_types                                                                                  |
| moderation | verification_document_types, club_rejection_reasons, coach_rejection_reasons, report_reasons, review_report_reasons, suspension_reasons, support_ticket_categories                                                                               |
| discovery  | badge_types, featured_collections, search_keywords, search_synonyms, popular_searches, discovery_sections                                                                                                                                        |
| commerce   | membership_plan_types, pricing_models, subscription_periods, cancellation_reasons, discount_categories, invoice_item_types, refund_reasons                                                                                                       |

## CRUD and actions

All management operations require an authenticated active user with the admin role. Query actions never bypass the HTTP method or authorization.

| Method | Suffix | Action (optional unless noted)              |
| ------ | ------ | ------------------------------------------- |
| GET    | base   | list                                        |
| GET    | /:id   | get                                         |
| POST   | base   | create                                      |
| PATCH  | /:id   | update                                      |
| PATCH  | /:id   | activate or deactivate (no body needed)     |
| DELETE | /:id   | delete                                      |
| POST   | base   | seed (required for seeding; no body needed) |

Examples: `GET /api/v1/geography/countries?page=1&limit=50&search=ایران`, `POST /api/v1/facilities/roof_types` with `{ "name": "سقف متحرک", "code": "RETRACTABLE" }`, `PATCH /api/v1/facilities/roof_types/:id?action=deactivate`.

Lists return `{items, page, limit, total, totalPages}`. Defaults are page 1 and limit 50, maximum limit 100. Filters: `search` (or `q`, max 200 characters), `isActive=true|false`, `parentId`; sorting: `sortBy` and `sortDirection=asc|desc`. Search includes names, primary display fields, codes, slugs, aliases and descriptions, with Persian/Arabic ی and ک and spacing normalization. Parent filters use the resource's first hierarchy relation. Invalid IDs, payload types, repeated query parameters and unsupported actions return client errors.

Names are normalized for uniqueness. Codes are stable and immutable after creation. In-use hierarchy/profile options cannot be deleted; deactivate them instead. Geography maintains explicit country → province → city → district → neighborhood relationships.

## Consumer options and compatibility

`GET base?action=options` and `GET base/:id?action=options` expose only active records. These reads are public for sports, clubs, facilities, geography, classes, cancellation reasons, report reasons and search keywords. Editorial configuration and other moderation/discovery/commerce resources remain admin-only even with this action. `isActive=false` cannot override options filtering.

The admin, business resource client and discovery resource client use canonical paths. Legacy `/resources/:category/:resource`, `/public/catalog/...` and `/business/catalog/...` remain compatible with existing consumers. The old business tag creation endpoint is now admin-only; owners select existing tags.

## Club profile references

New categorical values are stored as IDs: per-space `floorTypeId`, `roofTypeId`, `lightingTypeId`, `waterTreatmentTypeId`; profile-wide `ventilationTypeId`, `coolingTypeId`, `parkingTypeId`, `accessibilityTypeId`; and `firstVisit.requiredItemIds`.

Owner and public detail responses include `profileResources` keyed by ID with `{name,isActive}`. Renames resolve on subsequent reads. New selections must be active and belong to the correct resource. Existing inactive profile selections can be preserved; they are not offered for new selections. Legacy text is readable and may be preserved or removed but cannot be used to introduce new uncontrolled options. Selecting a resource ID clears its corresponding old text field. Counts, dimensions and narrative instructions remain typed values/free text rather than resources.

## Iran seed data

`POST /api/v1/resources/registry?action=seed` adds all resources and resolves seed dependencies; the admin resources dashboard exposes the same operation. Individual resources also have `POST base?action=seed`.

Seeds include all 31 Iranian provinces and their capitals, existing district/neighborhood examples, sports and facility options, review criteria, local operating/commerce terms and Persian search aliases. They are starter catalogs, not an exhaustive geographic directory or certification of a club's facilities.

Seeding is idempotent and preserves managed names, descriptions and inactive state, while backfilling absent fields. Canonical seeding does not create sample articles. A failure can be retried; seeding is not an all-or-nothing transaction. No live database seed or backfill is automatically run by this code change.

Tests cover every registered route, all seed resources, repeat seeding, admin-only writes, active-only reads, CRUD, pagination/search, invalid queries, club reference validation, inactive preservation and deletion protection. HTTP authorization tests substitute token verification but run the real resource access guard; existing JWT authentication is reused unchanged.
