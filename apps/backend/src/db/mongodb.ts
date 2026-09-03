import { MongoClient, type Db } from "mongodb";

import type { Env } from "../config/env.js";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectMongo(env: Env): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(env.MONGODB_URL);
  await client.connect();
  db = client.db();

  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectMongo() first.");
  }

  return db;
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}
