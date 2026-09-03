import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Db } from "mongodb";
import type { Connection } from "mongoose";

import { setDb } from "../db/mongodb";
import { ensureDiscoveryIndexes } from "../services/discovery";

@Injectable()
export class MongoBridge implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit(): Promise<void> {
    const db = this.connection.db;

    if (!db) {
      throw new Error("MongoDB is not connected.");
    }

    setDb(db as unknown as Db);
    await ensureDiscoveryIndexes();
  }
}
