export interface OfflineStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Transactions resolve on commit, so a queued action is durable before the UI confirms it. */
export function createOfflineStorage(name: string): OfflineStorage {
  let database: Promise<IDBDatabase> | undefined;
  function open() {
    database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("records");
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          database = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        database = undefined;
        reject(request.error);
      };
      request.onblocked = () =>
        reject(new Error("Offline database is blocked"));
    });
    return database;
  }
  async function transaction<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("records", mode);
      const request = run(tx.objectStore("records"));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () =>
        reject(tx.error ?? new Error("Offline transaction failed"));
      tx.onerror = () => reject(tx.error);
    });
  }
  return {
    get: <T>(key: string) =>
      transaction<T | undefined>("readonly", (store) => store.get(key)),
    set: async (key, value) => {
      await transaction("readwrite", (store) => store.put(value, key));
    },
    remove: async (key) => {
      await transaction("readwrite", (store) => store.delete(key));
    },
  };
}
