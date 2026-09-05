import { Injectable } from "@nestjs/common";
import { Storage } from "@google-cloud/storage";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { AppError } from "../../common/errors/app.exception";
import { AppConfigService } from "../../config/app-config.service";

@Injectable()
export class ExportStorageService {
  private readonly gcs: Storage;

  constructor(private readonly config: AppConfigService) {
    const env = config.env;
    const hasInlineCredentials = Boolean(
      env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY,
    );
    this.gcs = new Storage({
      ...(env.FIREBASE_PROJECT_ID
        ? { projectId: env.FIREBASE_PROJECT_ID }
        : {}),
      ...(env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
        ? { keyFilename: env.FIREBASE_SERVICE_ACCOUNT_PATH.trim() }
        : hasInlineCredentials
          ? {
              credentials: {
                client_email: env.FIREBASE_CLIENT_EMAIL,
                private_key: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
              },
            }
          : {}),
    });
  }

  async store(key: string, content: Buffer, mimeType: string) {
    this.assertKey(key);
    if (this.config.env.EXPORT_STORAGE_DRIVER === "gcs") {
      const bucket = this.bucket();
      await bucket.file(key).save(content, {
        contentType: mimeType,
        resumable: false,
        metadata: { cacheControl: "private, max-age=0, no-store" },
      });
      return;
    }
    const target = resolve(this.config.env.EXPORT_LOCAL_DIR, key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, { flag: "wx" });
  }

  async download(key: string) {
    this.assertKey(key);
    if (this.config.env.EXPORT_STORAGE_DRIVER === "gcs") {
      const [url] = await this.bucket()
        .file(key)
        .getSignedUrl({
          version: "v4",
          action: "read",
          expires:
            Date.now() + this.config.env.EXPORT_SIGNED_URL_MINUTES * 60_000,
        });
      return { url, content: null };
    }
    return {
      url: null,
      content: await readFile(resolve(this.config.env.EXPORT_LOCAL_DIR, key)),
    };
  }

  async remove(key: string) {
    this.assertKey(key);
    if (this.config.env.EXPORT_STORAGE_DRIVER === "gcs") {
      await this.bucket().file(key).delete({ ignoreNotFound: true });
      return;
    }
    try {
      await unlink(resolve(this.config.env.EXPORT_LOCAL_DIR, key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  private bucket() {
    const name = this.config.env.EXPORT_GCS_BUCKET;
    if (!name) {
      throw new AppError(
        503,
        "EXPORT_STORAGE_NOT_CONFIGURED",
        "Export storage bucket is not configured",
      );
    }
    return this.gcs.bucket(name);
  }

  private assertKey(key: string) {
    if (!/^[a-f\d]{24}\/[a-f\d-]+\.(csv|xlsx)$/i.test(key)) {
      throw new AppError(400, "INVALID_EXPORT_KEY", "Invalid export key");
    }
  }
}
