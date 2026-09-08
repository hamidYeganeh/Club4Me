# Vital Free50 server data — 2026-09-08

Uploaded the local `data/exercise-catalog/runs/vital-active` package to the existing `gym4me-vps` production server, without deploying application code or restarting containers.

- Backend-visible private directory: `/data/media/training-vital-free50-v1`
- Persistent volume: `club4me_media_data`
- Database/collection: `gym4me.training_exercises`
- Record IDs: `vital:0051` through `vital:0100`
- Initial status: `draft`, review status: `unreviewed`
- Includes localized names/filter labels, original English instructions, metadata, license references and private media paths/checksums.
- 50 original MP4s; 203,180,740 video bytes (not yet compressed).
- All 50 SHA256 hashes verified inside the running backend container before inserting records.
- Preflight found zero existing matching IDs. Apply inserted 50; follow-up read verified 50 and no conflicts.
- Seed uses stable Mongo `_id` and `$setOnInsert`; it does not overwrite or delete existing records, plans or assignments.
- Files restricted to root and backend group 1001 (directories 750, files 640).

The live backend has not yet deployed the training module. These assets and seed records are staged for use, not evidence of a live animation endpoint. For the current branch's file-backed reader, set `TRAINING_CATALOG_DIR=/data/media/training-vital-free50-v1` when deploying the reviewed backend release. That reader consumes the packaged JSON; it does not yet read edits made to `training_exercises`. Do not claim Mongo is the runtime source until that integration is implemented.

Preserve publisher licenses; do not expose the package or raw database as a public download. The original downloaded files and local database remain unchanged. No purchases, main-branch merge, full application deployment, or production restart occurred.
