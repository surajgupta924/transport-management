import { env } from './env.js';

let redis = null;
let redisAvailable = false;
let RedisCtor = null;

export function isRedisAvailable() {
  return redisAvailable && redis !== null;
}

export async function getRedis() {
  if (!env.redisUrl) return null;
  if (redis) return redis;

  try {
    const mod = await import('ioredis');
    RedisCtor = mod.default;
    redis = new RedisCtor(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      console.warn('[redis] error:', err.message);
      redisAvailable = false;
    });
    redis.on('connect', () => {
      redisAvailable = true;
    });
    await redis.connect();
    redisAvailable = true;
    console.log('[redis] connected');
    return redis;
  } catch (err) {
    console.warn('[redis] unavailable, jobs will no-op:', err.message);
    redis = null;
    redisAvailable = false;
    return null;
  }
}

export async function closeRedis() {
  if (redis) {
    try {
      await redis.quit();
    } catch {
      // ignore
    }
    redis = null;
    redisAvailable = false;
  }
}
