import path from "node:path";
import { defineConfig } from "prisma/config";

process.loadEnvFile();

export default defineConfig({
  engine: "classic",
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
