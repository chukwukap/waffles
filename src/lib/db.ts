import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client";
import { env } from "./env";

const pool = new PrismaPg({ connectionString: env.databaseUrl! });
export const prisma = new PrismaClient({ adapter: pool });

const globalForPrisma = global as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// re-export everything from Prisma client for convenience
export * from "../../prisma/generated/client";
