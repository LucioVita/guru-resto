'use server';

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateAfipSettingsAction(formData: FormData) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const updateData: any = {
        updatedAt: new Date(),
    };

    // Helper to add field if present in formData
    const setIfPresent = (key: string, dbKey: string = key, isInt: boolean = false) => {
        const val = formData.get(key);
        if (val !== null) {
            updateData[dbKey] = isInt ? (parseInt(val as string) || null) : (val as string || null);
        }
    };

    setIfPresent("name");
    setIfPresent("phone");
    setIfPresent("address");
    setIfPresent("apiKey");
    setIfPresent("webhookUrl");
    setIfPresent("webhookStatusUrl");
    setIfPresent("afipCuit");
    setIfPresent("afipToken");
    setIfPresent("afipEnvironment");
    setIfPresent("afipPuntoVenta", "afipPuntoVenta", true);
    setIfPresent("afipCertificate");
    setIfPresent("afipPrivateKey");

    await db.update(businesses)
        .set(updateData)
        .where(eq(businesses.id, session.user.businessId));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/afip");
}
