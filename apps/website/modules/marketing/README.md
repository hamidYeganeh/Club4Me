# Gym4Me public website

The landing page keeps its original section order, bento layouts, coach carousel, metric stack, orbit cards, booking illustration, and scrolling phone preview. Product copy describes implemented discovery, reservations, training, progress, memberships, and coach feedback. The metric and phone examples are explicitly labeled illustrative. Promotional portraits are decorative; public catalog cards use real API records and local website detail links, with loading/retry/empty states.

The website imports the application's shared Sandow theme. Discovery pages use its surface, radius, typography, and color tokens in both light and dark modes, with responsive layouts and reduced-motion support.

## Public discovery

- `/discovery`: search across clubs, classes, coaches, and articles.
- `/discovery/{clubs,classes,coaches,articles}`: server-rendered lists, search, and crawlable pagination.
- `/discovery/{kind}/{slug}`: server-rendered details; identifier aliases permanently redirect to the published slug. Missing/unpublished records return 404. API failures are not treated as missing records.
- Personal actions continue in the application. The website never uses authentication tokens to fetch public catalog data.
- Article HTML is sanitized on the server. No scripts, event handlers, or unsafe link protocols are rendered.

`CATALOG_API_URL` selects the server-side API base, falling back to `NEXT_PUBLIC_API_URL`, then `https://api.gym4me.ir/api/v1`. Public fetches have a 10-second timeout and 5-minute revalidation. Availability shown on a class page must be rechecked in the app before booking.

`NEXT_PUBLIC_WEBSITE_URL` sets the canonical origin (default `https://gym4me.ir`). `NEXT_PUBLIC_APPLICATION_URL` sets the application origin (default `https://app.gym4me.ir`). Store buttons use `NEXT_PUBLIC_APP_STORE_URL` and `NEXT_PUBLIC_PLAY_STORE_URL`; unconfigured stores stay disabled. The contact form opens an email draft without simulating submission.

## SEO

Pages have distinct titles, descriptions, canonical URLs, Open Graph/Twitter metadata, and breadcrumb JSON-LD. Detail pages add Article, Person, Course, or SportsActivityLocation data based on visible public content. Ratings are included only when reviews exist. Search pages use noindex/follow; each unfiltered pagination page has its own canonical. Robots references the dynamic sitemap, which walks all catalog pages and fails on API outages rather than returning a cached partial inventory. The sitemap does not invent modification timestamps.

References: [Google pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), and [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

## Validation

From the repository root:

- `npm run lint --workspace=website`
- `npm run check-types --workspace=website`
- `npm run build --workspace=website`
- `npm run test:discovery --workspace=website` after building. Requires local Chrome. Starts isolated test servers on ports 17081/17082 with synthetic API fixtures; never writes production records. Tests SSR content, metadata, structured data, canonical redirects, 404s, search, pagination, article sanitization, sitemap, social image, restored section IDs, and mobile/desktop overflow.

Production catalog reachability and Search Console indexing should be checked after deployment; local fixture tests do not establish either.
