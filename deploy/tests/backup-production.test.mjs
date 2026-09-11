import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Exercise the real archive/validation/cleanup steps with synthetic container data.
// Container transport and flock are stubbed; production lock concurrency is not tested here.
for (const failMedia of [false, true])
  test(`backup media ${failMedia ? "failure leaves no complete backup" : "restores uploaded files"}`, () => {
    const dir = mkdtempSync(join(tmpdir(), "club4me-backup-test-"));
    try {
      const source = join(dir, "media");
      mkdirSync(source);
      writeFileSync(join(source, "private-document.txt"), "synthetic upload");
      const docker = join(dir, "docker");
      writeFileSync(
        docker,
        `#!/bin/sh\ncase "$1:$2" in\n exec:club4me-mongodb-1) printf database | gzip ;;\n exec:club4me-redis-1) exit 0 ;;\n cp:*) printf redis > "$3" ;;\n exec:club4me-backend-1) ${failMedia ? "exit 1" : `tar -czf - -C '${source}' .`} ;;\n *) exit 2 ;;\nesac\n`,
        { mode: 0o700 },
      );
      const script = readFileSync(
        new URL("../backup-production.sh", import.meta.url),
        "utf8",
      )
        .replace(
          "BACKUP_ROOT=/opt/club4me-backups/daily",
          `BACKUP_ROOT='${dir}/backups'`,
        )
        .replace("LOCK=/run/lock/club4me-backup.lock", `LOCK='${dir}/lock'`)
        .replace("flock -n 9 || exit 0", ": # single-process fixture")
        .replaceAll("/usr/bin/docker", `'${docker}'`);
      const path = join(dir, "backup.sh");
      writeFileSync(path, script);
      const run = spawnSync("sh", [path], { encoding: "utf8" });
      if (failMedia) {
        assert.notEqual(run.status, 0);
        assert.deepEqual(readdirSync(join(dir, "backups")), []);
      } else {
        assert.equal(run.status, 0, run.stderr);
        const backup = join(
          dir,
          "backups",
          readdirSync(join(dir, "backups"))[0],
        );
        assert.ok(existsSync(join(backup, "COMPLETE")));
        assert.match(
          readFileSync(join(backup, "SHA256SUMS"), "utf8"),
          /media.tar.gz/,
        );
        const restore = join(dir, "restore");
        mkdirSync(restore);
        assert.equal(
          spawnSync("tar", [
            "-xzf",
            join(backup, "media.tar.gz"),
            "-C",
            restore,
          ]).status,
          0,
        );
        assert.equal(
          readFileSync(join(restore, "private-document.txt"), "utf8"),
          "synthetic upload",
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
