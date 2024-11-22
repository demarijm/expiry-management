import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
  prisma.$connect();
  console.log(" --------------- Production DB connected ---------------------");
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
    global.prisma.$connect();
    console.log("---------------- Development DB connected --------------------");
  }

  prisma = global.prisma;
}

export default prisma;
