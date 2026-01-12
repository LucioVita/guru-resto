'use server';

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateBusinessAction(formData: FormData) {
    const session = await auth();
    if (!session || !session.user.businessId) {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const webhookUrl = formData.get("webhookUrl") as string;
    const webhookStatusUrl = formData.get("webhookStatusUrl") as string;
    const apiKey = formData.get("apiKey") as string;

    const afipCuit = formData.get("afipCuit") as string;
    const afipToken = formData.get("afipToken") as string;
    const afipEnvironment = formData.get("afipEnvironment") as "dev" | "prod";
    const afipPuntoVenta = parseInt(formData.get("afipPuntoVenta") as string) || 1;
    const afipCertificate = formData.get("afipCertificate") as string;
    const afipPrivateKey = formData.get("afipPrivateKey") as string;

    await db.update(businesses)
        .set({
            name,
            webhookUrl,
            webhookStatusUrl,
            apiKey,
            afipCuit,
            afipToken,
            afipEnvironment,
            afipPuntoVenta,
            afipCertificate,
            afipPrivateKey,
            updatedAt: new Date(),
        })
        .where(eq(businesses.id, session.user.businessId));

    revalidatePath("/dashboard/settings");
}
