// /src/server/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple instances of PrismaClient in development
  // (prevents exhausting database connections on hot-reload)
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.prisma ||
  new PrismaClient({
    log: ["query"], // optional: log queries for debugging
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
