import IORedis from "ioredis";

/**
 * Shared Redis connection for BullMQ queues and workers.
 *
 * If Redis is unavailable, the scheduler automatically falls back
 * to setInterval mode. No errors are thrown to the process.
 */
const REDIS_URL = process.env.REDIS_URL;

let connection = null;
let isRedisAvailable = false;
let connectionChecked = false;

/**
 * Attempt to connect to Redis. Resolves true/false, never throws.
 */
async function testRedisConnection() {
  if (connectionChecked) return isRedisAvailable;

  try {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 2) return null; // Give up after 2 retries
        return 500;
      },
    });

    // Swallow all error events so they don't crash the process
    connection.on("error", () => {});

    await connection.connect();
    // Quick ping to verify
    await connection.ping();

    isRedisAvailable = true;
    connectionChecked = true;
    console.log("[Redis] ✅ Connected to Redis");
    return true;
  } catch {
    isRedisAvailable = false;
    connectionChecked = true;

    // Cleanly disconnect the failed connection
    if (connection) {
      try {
        connection.disconnect();
      } catch {
        // ignore
      }
      connection = null;
    }

    console.warn(
      "[Redis] ⚠️  Redis not available — automation will use setInterval fallback",
    );
    return false;
  }
}

export { testRedisConnection };
export const getRedisAvailability = () => isRedisAvailable;
export const getConnection = () => connection;
export default connection;
