import { Server } from "http";
import app from "./app";
import config from "./app/config";
import { redisClient } from "./app/redis/redis";
import seedData from "./db/seedData";

import logger from "./app/lib/logger";
import prisma from "./app/lib/prisma";
let server: Server;
//export const io = initializeSocketIO(createServer(app));
const main = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");

    server = app.listen(Number(config.port), () => {
      console.log(`⚡️[server]: Server is running at http://${config.ip}:${config.port}`);
    });

    //io.listen(Number(config.socket_port));
    //console.log(`⚡️[server]: Socket is running at http://${config.ip}:${config.socket_port}`);
    //global.socketio = io;
    //app.set("socketio", io);

    //?  =========================================== SEED DATA START =========================================== //
    await seedData();
    //?  =========================================== SEED DATA END =========================================== //

    //? REDIS HEALTH CHECKER
    //await checkRedisHealth();
  } catch (error) {
    console.log(error);
  }
};

main();

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Received shutdown signal. Closing server gracefully...");

  server.close(async () => {
    logger.info("HTTP server closed");

    // Close database connection
    await prisma.$disconnect();
    logger.info("Database connection closed");

    // Close Redis connections
    await redisClient.quit();
    logger.info("Redis connection closed");

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("unhandledRejection", (reason) => {
  console.log(reason);
  console.log("unhandledRejection detected server shutting down 😈");

  if (server) {
    server.close(() => process.exit(1));
  }
  process.exit(1);
});

process.on("uncaughtException", (reason) => {
  console.log(reason);
  console.log("uncaughtException detected server shutting down 😈");
  process.exit(1);
});
