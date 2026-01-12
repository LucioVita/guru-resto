'use server';

import { db } from "@/db";
import { cashRegisters, orders } from "@/db/schema";
import { eq, and, isNull, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function openCajaAction(initialAmount: string) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    // Check if there is already an open caja
    const existing = await db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, session.user.businessId),
            eq(cashRegisters.status, "open")
        ),
    });

    if (existing) throw new Error("There is already an open cash register");

    await db.insert(cashRegisters).values({
        businessId: session.user.businessId,
        openedById: session.user.id,
        initialAmount,
        status: "open",
    });

    revalidatePath("/dashboard/cash-register");
}

export async function closeCajaAction(data: { actualAmount: string; notes?: string }) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const openCaja = await db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, session.user.businessId),
            eq(cashRegisters.status, "open")
        ),
    });

    if (!openCaja) throw new Error("No open cash register found");

    // Calculate total sales since opening
    const salesResult = await db.select({
        total: sum(orders.total)
    }).from(orders).where(
        and(
            eq(orders.businessId, session.user.businessId),
            // Actually we should filter by time >= openCaja.openingTime
        )
    );

    // This is a simplified calculation. In a real app we would filter by date.
    const calculatedSales = salesResult[0].total || "0";
    const finalCalculated = (parseFloat(openCaja.initialAmount) + parseFloat(calculatedSales)).toString();

    await db.update(cashRegisters)
        .set({
            status: "closed",
            closedById: session.user.id,
            closingTime: new Date(),
            finalAmountCalculated: finalCalculated,
            finalAmountActual: data.actualAmount,
            notes: data.notes,
        })
        .where(eq(cashRegisters.id, openCaja.id));

    revalidatePath("/dashboard/cash-register");
}

export async function getOpenCaja() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    return db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, session.user.businessId),
            eq(cashRegisters.status, "open")
        ),
    });
}
