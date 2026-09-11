# Production media backup

`deploy/backup-production.sh` now includes the backend's `/data/media` mount as
`media.tar.gz`. This includes uploaded images and private documents. Archive
validation must succeed before `COMPLETE` is created. `SHA256SUMS` covers Mongo,
Redis and media; a failed backup is removed by the existing cleanup trap.

Backups remain mode 0700 directories with mode 0600 files. Keep access restricted;
do not publish these archives or copy them into a web-served directory.

For a recovery drill, use an isolated environment first:

1. Select a backup directory containing `COMPLETE` and verify `sha256sum -c SHA256SUMS` there.
2. Restore its Mongo archive and Redis snapshot using the existing database recovery procedure.
3. Extract `media.tar.gz` into the isolated backend's media volume. Preserve the backend's file ownership and permissions.
4. Confirm a public image loads and a private document still requires its authorized account.
5. Before a real recovery, stop application writes and restore all three components from the same backup set.

The script makes live backups; it does not claim an atomic snapshot across Mongo,
Redis and filesystem uploads. The local test uses synthetic container outputs and
checks media extraction and failure cleanup, not a production disaster-recovery drill.

Run the local regression checks with:

```sh
node --test deploy/tests/backup-production.test.mjs
```
