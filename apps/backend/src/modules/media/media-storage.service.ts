import { Injectable } from "@nestjs/common";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
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

  privateUrl(id: string) {
    const expires = String(Date.now() + 5 * 60_000);
    return `${this.url(id)}?expires=${expires}&signature=${this.signature(id, expires)}`;
  }

  allowsPrivateFile(id: string, expires?: string, signature?: string) {
    if (
      !expires ||
      !/^\d{13}$/.test(expires) ||
      Number(expires) <= Date.now() ||
      Number(expires) > Date.now() + 5 * 60_000 ||
      !signature ||
      !/^[a-f0-9]{64}$/.test(signature)
    )
      return false;
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(this.signature(id, expires), "hex"),
    );
  }

  private signature(id: string, expires: string) {
    return createHmac("sha256", this.config.env.JWT_SECRET)
      .update(`private-media:${id}:${expires}`)
      .digest("hex");
  }
}
