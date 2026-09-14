import {
  MongoMemoryServer as Server,
  MongoMemoryReplSet as ReplSet,
} from "mongodb-memory-server";

// Small fixtures do not need MongoDB's host-sized cache or oplog. Keep tests
// reproducible on developer machines and CI without changing transaction support.
const cacheArgs = ["--wiredTigerCacheSizeGB", "0.25"];
export type MongoMemoryServer = Server;
export const MongoMemoryServer = {
  create(options: Parameters<typeof Server.create>[0] = {}) {
    return Server.create({
      ...options,
      instance: {
        ...options.instance,
        launchTimeout: options.instance?.launchTimeout ?? 30000,
        args: [...cacheArgs, ...(options.instance?.args ?? [])],
      },
    });
  },
};
export type MongoMemoryReplSet = ReplSet;
export const MongoMemoryReplSet = {
  create(options: Parameters<typeof ReplSet.create>[0] = {}) {
    return ReplSet.create({
      ...options,
      replSet: {
        ...options.replSet,
        args: [
          ...cacheArgs,
          ...(options.replSet?.args?.includes("--oplogSize")
            ? []
            : ["--oplogSize", "16"]),
          ...(options.replSet?.args ?? []),
        ],
      },
      instanceOpts: Array.from(
        {
          length: Math.max(
            options.replSet?.count ?? 1,
            options.instanceOpts?.length ?? 0,
          ),
        },
        (_, index) => ({
          launchTimeout: 30000,
          ...options.instanceOpts?.[index],
        }),
      ),
    });
  },
};
