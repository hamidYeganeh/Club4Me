export type RedisSetExpiry = "EX" | "PX";

export interface RedisPipelineLike {
  set(
    key: string,
    value: string,
    expiryMode: RedisSetExpiry,
    time: number,
  ): this;
  sadd(key: string, member: string): this;
  expire(key: string, seconds: number): this;
  del(key: string): this;
  srem(key: string, member: string): this;
  exec(): Promise<unknown>;
}

export interface RedisClientLike {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    expiryMode?: RedisSetExpiry,
    time?: number,
  ): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  pttl(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  sadd(key: string, member: string): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  ping(): Promise<string>;
  quit(): Promise<unknown>;
  connect?(): Promise<unknown>;
  pipeline(): RedisPipelineLike;
  eval(
    script: string,
    numKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown>;
}

export const REDIS_CLIENT = "REDIS_CLIENT";
