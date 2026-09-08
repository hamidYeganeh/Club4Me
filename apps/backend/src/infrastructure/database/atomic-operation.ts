import { AsyncLocalStorage } from "node:async_hooks";
import type { Connection, ClientSession } from "mongoose";

const context = new AsyncLocalStorage<{
  connection: Connection;
  session?: ClientSession;
  effects: Array<() => Promise<unknown>>;
}>();
export function inAtomicOperation() {
  return Boolean(context.getStore());
}
export async function afterCommit(effect: () => Promise<unknown>) {
  const current = context.getStore();
  if (current) {
    current.effects.push(effect);
    return;
  }
  await effect();
}
export async function atomicOperation<T>(
  connection: Connection,
  operation: () => Promise<T>,
): Promise<T> {
  const parent = context.getStore();
  if (parent) {
    if (parent.connection !== connection)
      throw new Error("A transaction cannot span database connections");
    return operation();
  }
  connection.base.set("transactionAsyncLocalStorage", true);
  let effects: Array<() => Promise<unknown>> = [];
  const result = await connection.transaction(async (session) => {
    const attempt = {
      connection,
      session,
      effects: [] as Array<() => Promise<unknown>>,
    };
    const value = await context.run(attempt, operation);
    effects = attempt.effects;
    return value;
  });
  // Run only the successful attempt's effects, outside the database session.
  for (const effect of effects) await effect();
  return result;
}

export async function lockPaymentReference(
  connection: Connection,
  type: string,
  id: string,
) {
  const session = context.getStore()?.session;
  if (!session)
    throw new Error("Payment reference locks require a transaction");
  await connection
    .collection<{ _id: string; revision: number }>("commerce_reference_locks")
    .updateOne(
      { _id: `${type}:${id}` },
      { $inc: { revision: 1 } },
      { upsert: true, session },
    );
}

export function Atomic(modelProperty: string): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    descriptor.value = function (
      this: Record<string, { db: Connection }>,
      ...args: unknown[]
    ) {
      return atomicOperation(this[modelProperty]!.db, () =>
        original.apply(this, args),
      );
    };
  };
}
