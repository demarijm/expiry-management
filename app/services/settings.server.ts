import prisma from "./../db.server";
import { Settings } from "@prisma/client";
import { addLogs } from "./logs.server";

export type SettingPayload = Omit<Settings, 'id'|'shop'>;

/**
 * create or update shop settings
 * 
 * @param session 
 * @param settingPayload 
 * @returns 
 */
export async function saveSettings(shop: string, settingPayload: SettingPayload) {
    try {
        // find shop settings
        const setting = await getSettings(shop);

        // setting exist, then update the setting
        if(setting) {
            const updatedSetting = await prisma.settings.update({
                data: settingPayload,
                where: { shop }
            });

            await addLogs({
                shop,
                action: 'app.settings.update',
                description: `App settings updated to: ${JSON.stringify(updatedSetting)}`,
                type: 'success'
            });
            
            return updatedSetting;
        }
        // else create setting
        const newSetting = await prisma.settings.create({ data: {...settingPayload, shop} });

        await addLogs({
            shop,
            action: 'app.settings.add',
            description: `App settings added: ${JSON.stringify(newSetting)}`,
            type: 'success'
        });

        return newSetting;
    } catch (error) {
        throw error;
    }
}

export async function getSettings(shop: string) {
    try {
        const settings = await prisma.settings.findFirst({ where: { shop } });
        return settings;
    } catch (error) {
        console.log("Prisma Error >> ", error);
        throw error;
    }
}