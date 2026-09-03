import { Injectable } from "@nestjs/common";

import { loadEnv, type Env } from "./env";

@Injectable()
export class AppConfigService {
  readonly env: Env;

  constructor() {
    this.env = loadEnv();
  }
}
