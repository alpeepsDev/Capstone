import IORedis from "ioredis";
import logger from "../utils/logger.js";

const REDIS_URL = process.env.REDIS_URL;

let connection = null;
let isRedisAvailable = false;
let connectionChecked = false;

async function testRedisConnection() {
  if (connectionChecked) return isRedisAvailable;

  if (!REDIS_URL) {
    logger.warn("[Redis] REDIS_URL not set, skipping Redis");
    connectionChecked = true;
    return false;
  }

  try {
    const opts = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 2) return null;
        return 500;
      },
    };

    if (REDIS_URL.startsWith("rediss://")) {
      opts.tls = {};
    }

    connection = new IORedis(REDIS_URL, opts);

    connection.on("error", (err) => {
      logger.warn(`[Redis] Connection error: ${err.message}`);
    });

    await connection.connect();
    await connection.ping();

    isRedisAvailable = true;
    connectionChecked = true;
    logger.info("[Redis] Connected to Redis");
    return true;
  } catch (err) {
    isRedisAvailable = false;
    connectionChecked = true;

    if (connection) {
      try {
        connection.disconnect();
      } catch {}
      connection = null;
    }

    logger.warn(
      `[Redis] Redis not available, falling back to setInterval: ${err.message}`,
    );
    return false;
  }
}

function getConnection() {
  return connection;
}

function getRedisAvailability() {
  return isRedisAvailable;
}

export { testRedisConnection, getConnection, getRedisAvailability };
