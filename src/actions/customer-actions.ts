'use server';

import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function addCustomerAction(formData: FormData) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const notes = formData.get("notes") as string;

    await db.insert(customers).values({
        businessId: session.user.businessId,
        name,
        phone,
        address,
        notes,
    });

    revalidatePath("/dashboard/customers");
}

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
