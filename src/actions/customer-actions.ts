'use server';

import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createCustomerAction(data: {
    name: string;
    phone?: string;
    address?: string;
    email?: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.insert(customers).values({
        id: crypto.randomUUID(),
        businessId: session.user.businessId,
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        email: data.email || null,
        notes: data.notes || null,
        status: 'active'
    });

    revalidatePath("/dashboard/customers");
}

export async function updateCustomerAction(data: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    email?: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.update(customers)
        .set({
            name: data.name,
            phone: data.phone || null,
            address: data.address || null,
            email: data.email || null,
            notes: data.notes || null,
        })
        .where(and(eq(customers.id, data.id), eq(customers.businessId, session.user.businessId)));

    revalidatePath("/dashboard/customers");
}

export async function deleteCustomerAction(id: string) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.delete(customers)
        .where(and(eq(customers.id, id), eq(customers.businessId, session.user.businessId)));

    revalidatePath("/dashboard/customers");
}

// Keep search for compatibility if used elsewhere, or update it
export async function searchCustomers(query: string) {
    const session = await auth();
    if (!session || !session.user.businessId) return [];

    return db.select().from(customers).where(
        and(
            eq(customers.businessId, session.user.businessId),
            or(
                ilike(customers.name, `%${query}%`),
                ilike(customers.phone, `%${query}%`)
            )
        )
    ).limit(10);
}
