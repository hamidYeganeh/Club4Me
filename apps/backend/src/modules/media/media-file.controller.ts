import { Controller, Get, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaFileController {
  constructor(private readonly service: MediaService) {}

  @Get(":id/file")
  async file(@Param("id") id: string, @Res() response: Response) {
    const file = await this.service.getFile(id);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // Revalidate so a blocked file cannot remain in a long-lived public cache.
    response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    response.sendFile(file.path);
  }
}
