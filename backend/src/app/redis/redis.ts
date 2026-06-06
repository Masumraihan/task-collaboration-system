import Redis from "ioredis";
import config from "../config";

const redisConfig = {
  host:
    config.nodeEnv === "development" ? "localhost" : (config.redis.host as string) || "localhost",
  port: Number(config.redis.port) || 6379,
  lazyConnect: true, // Connect only when first command is issued
  enableOfflineQueue: true, // Queue commands when offline
  connectTimeout: 10000, // 10 seconds timeout for initial connection
  maxRetriesPerRequest: 5, // Max retries per command
  readOnly: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 500, 2000);
    if (times > 10) {
      return null;
    }
    return delay;
  },
  tls: undefined,
};

export const redisClient = new Redis(redisConfig);
export const redisPub = new Redis(redisConfig);
export const redisSub = new Redis(redisConfig);

// Event listeners for monitoring
redisClient.on("connect", () => {
  console.log("Redis connected successfully");
});

redisClient.on("ready", () => {
  console.log("Redis is ready to accept commands");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
  // Optionally: Add alerting (e.g., to Sentry or Slack)
});

redisClient.on("close", () => {
  console.log("Redis connection closed");
});

// Health check function (use in your app's /health endpoint)
export async function checkRedisHealth() {
  try {
    await redisClient.ping();
    return true;
  } catch (err) {
    console.error("Redis health check failed:", err);
    return false;
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down Redis connection");
  await redisClient.quit();
  process.exit(0);
});
