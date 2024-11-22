import { json } from "@remix-run/node";
import prisma from "./../db.server";
import { Logs } from "@prisma/client";

export type Payload = Omit<Logs, 'id'|'occured_at'>;

export async function addLogs(payload: Payload) {
    try {
        return await prisma.logs.create({ data: payload });
    } catch (error) {
        throw error;
    }
}

export async function getLogs(shop: string) {
    try {
        const logs = await prisma.logs.findMany({ where: { shop } });

        return logs;
    } catch (error) {
        throw error;
    }
}

export async function getLog(id: number, shop: string) {
    try {
        const log = await prisma.logs.findFirst({ where: { id, shop } });
        return log;
    } catch (error) {
        console.log("Prisma Error >> ", error);
        throw error;
    }
}

export async function deleteLog(id: number) {
    try {
        const log = await prisma.logs.delete({ where: { id } });
        return log;
    } catch (error) {
        console.log("Prisma Error >> ", error);
        throw error;
    }
}

export async function getRecentLogs(shop: string, take: number) {
    try {
        const args: any = {
            take,
            where: { shop },
            orderBy: {
                id: 'desc',
            },
          };

          const logs = await prisma.logs.findMany(args);

          return logs;
    } catch (error) {
        throw error;
    }
}