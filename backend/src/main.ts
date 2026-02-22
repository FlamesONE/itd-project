import { createServer } from "./interface/graphql/server";
import { createSSEServer, shutdownSSEServer } from "./interface/http/SSEServer";
import { createUploadServer, shutdownUploadServer } from "./interface/http/UploadServer";
import { createHealthServer, shutdownHealthServer } from "./interface/http/HealthServer";
import { getPool } from "./infrastructure/persistence/postgresql/connection";
import { getRedis } from "./infrastructure/persistence/redis/connection";
import { getRedisPubSub } from "./infrastructure/services/realtime";

async function main() {
  try {
    console.log("Starting server...");

    const pool = getPool();
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");

    const redis = getRedis();
    await redis.ping();
    console.log("Redis connected");

    getRedisPubSub();
    console.log("Redis Pub/Sub initialized");

    const { url } = await createServer();
    console.log(`Server ready at ${url}`);

    const ssePort = parseInt(process.env.SSE_PORT || "4001", 10);
    const sseServer = createSSEServer(ssePort);

    const uploadPort = parseInt(process.env.UPLOAD_PORT || "4002", 10);
    const uploadServer = createUploadServer(uploadPort);

    const healthPort = parseInt(process.env.HEALTH_PORT || "4003", 10);
    const healthServer = createHealthServer(healthPort);

    const shutdown = async () => {
      console.log("Shutting down...");
      await Promise.all([
        shutdownSSEServer(sseServer),
        shutdownUploadServer(uploadServer),
        shutdownHealthServer(healthServer),
      ]);
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
