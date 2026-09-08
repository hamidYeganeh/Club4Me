/** Explicit transaction boundary for unit tests with in-memory query doubles. */
export const fakeTransactionConnection = {
  base: { set: () => undefined },
  transaction: <T>(operation: () => Promise<T>) => operation(),
};
