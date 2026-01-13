'use server';

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateAfipSettingsAction(data: {
    afipCuit: string;
    afipToken: string;
    afipEnvironment: 'dev' | 'prod';
    afipPuntoVenta: number;
    afipCertificate?: string;
    afipPrivateKey?: string;
}) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.update(businesses)
        .set({
            afipCuit: data.afipCuit,
            afipToken: data.afipToken,
            afipEnvironment: data.afipEnvironment,
            afipPuntoVenta: data.afipPuntoVenta,
            afipCertificate: data.afipCertificate || null,
            afipPrivateKey: data.afipPrivateKey || null,
            updatedAt: new Date(),
        })
        .where(eq(businesses.id, session.user.businessId));

    revalidatePath("/dashboard/settings/afip");
    return { success: true };
}
