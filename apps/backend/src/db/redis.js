let redisClient = null;
let isRedisConnected = false;

// High performance in-memory cache fallback
const inMemoryCache = new Map();
const cacheTimestamps = new Map();

async function initRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    // Attempt ioredis if installed
    const Redis = require('ioredis');
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      lazyConnect: true
    });
    await client.connect();
    redisClient = client;
    isRedisConnected = true;
    console.log(`✓ Connected to Redis server at ${redisUrl}`);
  } catch (e) {
    console.log(`ℹ Redis server not reachable (${e.message}). Using high-performance in-memory cache engine.`);
    isRedisConnected = false;
  }
}

async function get(key) {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      // fallback
    }
  }

  const record = inMemoryCache.get(key);
  if (!record) return null;
  if (record.expiry && Date.now() > record.expiry) {
    inMemoryCache.delete(key);
    cacheTimestamps.delete(key);
    return null;
  }
  return record.value;
}

async function set(key, value, ttlSeconds = 300) {
  const timestamp = new Date().toISOString();
  cacheTimestamps.set(key, timestamp);

  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return true;
    } catch (e) {
      // fallback
    }
  }

  inMemoryCache.set(key, {
    value,
    expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    cachedAt: timestamp
  });
  return true;
}

async function del(key) {
  cacheTimestamps.delete(key);
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (e) {}
  }
  inMemoryCache.delete(key);
}

function getCacheMetadata(key) {
  const cachedAt = cacheTimestamps.get(key) || null;
  return {
    isCached: true,
    lastSuccessfulSync: cachedAt,
    cacheSource: isRedisConnected ? 'Redis' : 'InMemoryCache'
  };
}

module.exports = {
  initRedis,
  get,
  set,
  del,
  getCacheMetadata,
  isRedisConnected: () => isRedisConnected
};
