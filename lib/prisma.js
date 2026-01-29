// lib/prisma.js - Prisma sem binário Rust (engineType client) para reduzir tamanho da função Netlify
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

function createPrisma() {
  const connectionString = process.env.DATABASE_URL || '';
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = createPrisma();
} else {
  if (!global.prisma) {
    global.prisma = createPrisma();
  }
  prisma = global.prisma;
}

export default prisma;
