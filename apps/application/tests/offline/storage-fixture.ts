import type { OfflineStorage } from "../../../../packages/api/src/offline/storage";

export function memoryStorage(): OfflineStorage {
  const records = new Map<string, unknown>();
  return {
    get: async <T>(key: string) =>
      structuredClone(records.get(key)) as T | undefined,
    set: async (key, value) => {
      records.set(key, structuredClone(value));
    },
    remove: async (key) => {
      records.delete(key);
    },
  };
}
