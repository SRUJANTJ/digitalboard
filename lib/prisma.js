import { PrismaClient } from "@prisma/client";

// Prevent creating a new PrismaClient (and new connection pool) on every
// hot-reload in dev. In production each serverless invocation gets its own.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
