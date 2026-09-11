import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { basename, dirname } from "node:path";
import type { Response } from "express";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaFileController {
  constructor(private readonly service: MediaService) {}

  @Get(":id/file")
  async file(
    @Param("id") id: string,
    @Res() response: Response,
    @Query("expires") expires?: string,
    @Query("signature") signature?: string,
  ) {
    const file = await this.service.getFile(id, expires, signature);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // Revalidate so a blocked file cannot remain in a long-lived public cache.
    response.setHeader(
      "Cache-Control",
      file.isPrivate
        ? "private, no-store"
        : "public, max-age=0, must-revalidate",
    );
    if (file.isPrivate) response.setHeader("Referrer-Policy", "no-referrer");
    // The trusted storage root may be hidden (the default is .artifacts/media).
    // Only the validated generated filename is subject to dotfile filtering.
    response.sendFile(basename(file.path), { root: dirname(file.path) });
  }
}
