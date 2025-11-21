import { createClient } from "redis";

export const createRedisClient = async () => {
  const redisURL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  const client = createClient({ url: redisURL });

  client.on("connect", () => console.log("Redis connected ✔"));
  client.on("error", (err) => console.error("Redis error ❌", err));

  await client.connect();
  return client;
};
