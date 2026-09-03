import type { Db } from "mongodb";

let db: Db | undefined;

export function setDb(database: Db): void {
  db = database;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB is not connected.");
  }

  return db;
}

export function clearDb(): void {
  db = undefined;
}
