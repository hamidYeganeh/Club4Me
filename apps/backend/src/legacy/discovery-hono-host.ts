import { getRequestListener } from "@hono/node-server";
import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import type { Request, Response } from "express";

import { AppConfigService } from "../config/app-config.service";
import { createDiscoveryHono } from "./discovery-hono";

@Injectable()
export class DiscoveryHonoHost implements OnApplicationBootstrap {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly config: AppConfigService,
  ) {}

  onApplicationBootstrap(): void {
    const expressApp = this.httpAdapterHost.httpAdapter.getInstance() as {
      use: (
        path: string,
        handler: (req: Request, res: Response) => void,
      ) => void;
    };
    const hono = createDiscoveryHono(this.config.env);
    const listener = getRequestListener(hono.fetch);

    expressApp.use("/api/v1/discovery", (req, res) => {
      listener(req, res);
    });
  }
}
