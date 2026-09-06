import { Injectable } from "@nestjs/common";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { AppConfigService } from "../../config/app-config.service";
import { AppError } from "../../common/errors/app.exception";

@Injectable()
export class MediaStorageService {
  constructor(private readonly config: AppConfigService) {}

  async store(content: Buffer): Promise<string> {
    const key = randomUUID();
    await mkdir(resolve(this.config.env.MEDIA_LOCAL_DIR), { recursive: true });
    await writeFile(this.path(key), content, { flag: "wx" });
    return key;
  }

  path(key: string): string {
    if (!/^[a-f0-9-]{36}$/.test(key)) {
      throw new AppError(404, "MEDIA_NOT_FOUND", "Media not found");
    }
    return resolve(this.config.env.MEDIA_LOCAL_DIR, key);
  }

  async remove(key: string) {
    await unlink(this.path(key)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  url(id: string): string {
    return `${this.config.env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, "")}/media/${id}/file`;
  }
}
