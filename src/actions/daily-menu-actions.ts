'use server';

import { db } from "@/db";
import { viandasDiarias, diaSemanaEnum } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export type DiaSemana = typeof diaSemanaEnum[number];

export interface DailyMenuItem {
    id?: number;
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
}

export async function getDailyMenusAction(diaSemana: DiaSemana) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const menus = await db.select().from(viandasDiarias).where(
        and(
            eq(viandasDiarias.businessId, session.user.businessId),
            eq(viandasDiarias.diaSemana, diaSemana)
        )
    );

    return menus;
}

export async function getAllDailyMenusAction() {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const menus = await db.select().from(viandasDiarias).where(
        eq(viandasDiarias.businessId, session.user.businessId)
    );

    return menus;
}

export async function saveDailyMenuAction(diaSemana: DiaSemana, items: DailyMenuItem[]) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    // Limit to 3 menus per day
    if (items.length > 3) {
        throw new Error("Máximo 3 menús por día");
    }

    // Get existing menus for this day
    const existing = await db.select().from(viandasDiarias).where(
        and(
            eq(viandasDiarias.businessId, session.user.businessId),
            eq(viandasDiarias.diaSemana, diaSemana)
        )
    );

    const existingIds = existing.map(e => e.id);
    const updatedIds: number[] = [];

    for (const item of items) {
        if (item.id && existingIds.includes(item.id)) {
            // Update existing
            await db.update(viandasDiarias)
                .set({
                    name: item.name,
                    description: item.description || null,
                    price: item.price,
                    isAvailable: item.isAvailable,
                })
                .where(and(
                    eq(viandasDiarias.id, item.id),
                    eq(viandasDiarias.businessId, session.user.businessId)
                ));
            updatedIds.push(item.id);
        } else {
            // Insert new
            await db.insert(viandasDiarias).values({
                businessId: session.user.businessId,
                diaSemana,
                name: item.name,
                description: item.description || null,
                price: item.price,
                isAvailable: item.isAvailable,
            });
        }
    }

    // Delete items that were removed
    for (const existingId of existingIds) {
        if (!updatedIds.includes(existingId)) {
            await db.delete(viandasDiarias).where(
                and(
                    eq(viandasDiarias.id, existingId),
                    eq(viandasDiarias.businessId, session.user.businessId)
                )
            );
        }
    }

    revalidatePath("/dashboard/daily-menu");
}

export async function toggleDailyMenuAvailabilityAction(id: number, isAvailable: boolean) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.update(viandasDiarias)
        .set({ isAvailable })
        .where(and(
            eq(viandasDiarias.id, id),
            eq(viandasDiarias.businessId, session.user.businessId)
        ));

    revalidatePath("/dashboard/daily-menu");
}

export async function deleteDailyMenuAction(id: number) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.delete(viandasDiarias).where(
        and(
            eq(viandasDiarias.id, id),
            eq(viandasDiarias.businessId, session.user.businessId)
        )
    );

    revalidatePath("/dashboard/daily-menu");
}
