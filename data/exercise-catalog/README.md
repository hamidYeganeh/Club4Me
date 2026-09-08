# Independent exercise database — no upstream runtime dependency

## Vital Free50 import

Run `node scripts/exercise-catalog/import-vital.mjs /absolute/path/to/VitalAnimations` on the publisher's extracted free download. This imports only the 50 matching metadata/video pairs, copying the original MP4s to a new gitignored `runs/vital-free-*` package. It produces SQLite with full-text search, portable JSON, source metadata, checksums and attribution. It does not download paid assets, modify production or compress media.

The inspected Free50 has 23 upper-leg, 15 shoulder, 9 cardio, 2 chest and 1 upper-arm records (publisher's categories). It is a useful demo subset, not a balanced full gym catalog. Character Samples are excluded because they have no accompanying structured records. Several metadata labels need review: for example, the Svend press is tagged bodyweight while its instructions specify plates. Imported records remain unreviewed.

Vital's official repository explicitly grants the free starter set the same commercial license terms as paid packages: https://github.com/exercisedb-pro/exercisedb-dataset. EULA 2026.1 at https://vitalanimations.com/license permits own-server/offline storage, technical conversions and metadata restructuring, but prohibits standalone redistribution. Retain license references and notices; do not upload these assets to a public repository or offer the raw database as a downloadable asset library. The importer labels this publisher grant separately from Creative Commons eligibility.

This pipeline copies public exercise metadata **once during preparation**, using official downloadable data/API endpoints. The application does not call these endpoints. The resulting SQLite/JSON and eligible downloaded assets can be hosted entirely on our infrastructure. Attribution URLs are references, not runtime media URLs.

## Prepare locally (Node 22.13+ with `node:sqlite`)

```sh
node --test scripts/exercise-catalog/model.test.mjs
node scripts/exercise-catalog/crawl.mjs
node scripts/exercise-catalog/download-media.mjs data/exercise-catalog/runs/EXACT_RUN_DIRECTORY
# Includes licensed videos; currently about 3.57 GB source video data:
node scripts/exercise-catalog/download-media.mjs data/exercise-catalog/runs/EXACT_RUN_DIRECTORY --videos
# Verify the resulting package without any network access:
node scripts/exercise-catalog/verify.mjs data/exercise-catalog/runs/EXACT_RUN_DIRECTORY/EXACT_SELFHOST_DIRECTORY
```

Every run creates a new directory and refuses to overwrite an existing database. Generated snapshots and media are gitignored. No production credentials are read; no MongoDB connection, deployment or app catalog mutation occurs.

To recover a completed package with transient transfer failures, repeat the media command with `--reuse PATH_TO_PREVIOUS_SELFHOST_DIRECTORY`. Previously downloaded files are checksum-verified and copied without downloading again. Recorded authorization/rate-limit refusals block automatic reuse until the source restriction is resolved.

Outputs:

- `catalog.sqlite`: relational exercises, translations, media, full-text search and source/license metadata.
- `catalog.json`: portable full candidate dataset with stable namespaced IDs.
- `manifest.json`: source revision, request hashes, counts, duplicate-name candidates and download failures.
- `ATTRIBUTION.json`: upstream author/license/source/change information.
- A `selfhost-*` directory from the media step contains actual downloaded `media/*` files, updated SQLite/JSON, and `backend-import.draft.json` for our backend. Runtime media entries in this draft export have **local paths only**, not remote fallback URLs.

The preparation scripts require internet access. The resulting files do not. Repeat the preparation step manually when updates are wanted; do not schedule it or add upstream API calls to the app.

## Licensing and content review

Source metadata currently comes from wger and a commit-pinned free-exercise-db snapshot. Keep sources separate; identical names are review candidates, not proof of identical exercises. There are near-duplicates across the sources.

wger licenses are resolved separately for each exercise, translation, image and video. Recognized CC BY 3/4, CC BY-SA 3/4 and CC0 URLs pass an initial license eligibility gate. BY/BY-SA entries require their own attribution; asset authors are never guessed from the parent exercise. Missing attribution, unrecognized licenses, external media URLs and explicitly AI-generated images are flagged. `license_eligible` is **not** a medical/content review or independent copyright warranty.

free-exercise-db declares Unlicense at repository level. Its entries remain `source_declared_unreviewed`; its images remain `image_provenance_review` and are never downloaded by this pipeline. The paid MuscleWiki and Gym Visual libraries are not crawled or included.

The imported content retains the original licenses. Our independent database is not a claim to exclusive ownership over upstream content. Preserve attribution and comply with applicable ShareAlike obligations for adaptations. Keep the source/author/license/change information available in the final app. Do not publish the complete mixed review snapshot as an unlicensed proprietary dataset.

## Deployment on our server

1. Review the candidate content, translations and attribution. `backend-import.draft.json` deliberately marks records as drafts; do not bulk-publish unreviewed descriptions or technique videos.
2. Copy the **entire selected selfhost directory**, including attribution and media, to our server/private object storage. Do not copy only the database and forget the assets.
3. Import reviewed records into our own MongoDB collection (e.g. `training_exercises`, unique `id`), or query the SQLite file read-only. Keep existing workout exercise IDs/snapshots unchanged; never replace their IDs by name matching.
4. Serve only local `media/*` via our own media endpoint/storage domain, with correct MIME, byte ranges for video, caching and `nosniff`. Do not use remote `sourceUrl` as an image/video fallback. Return our media URLs in our API responses.
5. Update the training API/library to read the reviewed collection and show author/license credits. The current app still has its original starter catalog until this separate integration is performed.
6. Verify local checksums and test with outbound access to wger/GitHub blocked. The app must continue to list exercises and play locally hosted media.

MOV/HEVC source videos can require an offline MP4/H.264 transcode for browser compatibility. Preserve the original and record that conversion as an adaptation; do not assume every original video plays on every phone.

No server deployment is performed by these scripts. The server destination and review/publication policy must be chosen before deploying.

## Example offline queries

```sql
SELECT source, COUNT(*) FROM exercises GROUP BY source;
SELECT kind, COUNT(*) FROM media WHERE local_path IS NOT NULL GROUP BY kind;
SELECT name, language FROM exercise_search WHERE exercise_search MATCH 'squat' LIMIT 20;
SELECT id, name FROM exercises WHERE rights_status <> 'license_eligible';
```
