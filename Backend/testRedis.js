import { createRedisClient } from "./config/redis.js";
import "dotenv/config";

const testRedis = async () => {
  try {
    const redisClient = await createRedisClient();

    await redisClient.set("test_key", "Trackify");
    const value = await redisClient.get("test_key");

    console.log("Redis test value:", value);
  } catch (err) {
    console.error("Redis test error:", err);
  }
};

testRedis();
