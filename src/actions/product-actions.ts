'use server';

import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function addProductAction(formData: FormData) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const category = formData.get("category") as string;

    await db.insert(products).values({
        businessId: session.user.businessId,
        name,
        description,
        price,
        category,
    });

    revalidatePath("/dashboard/products");
}

export async function updateProductAction(id: string, formData: FormData) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const category = formData.get("category") as string;

    await db.update(products)
        .set({ name, description, price, category })
        .where(and(eq(products.id, id), eq(products.businessId, session.user.businessId)));

    revalidatePath("/dashboard/products");
}

export async function toggleProductAvailabilityAction(id: string, isAvailable: boolean) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.update(products)
        .set({ isAvailable })
        .where(and(eq(products.id, id), eq(products.businessId, session.user.businessId)));

    revalidatePath("/dashboard/products");
}

export async function deleteProductAction(id: string) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.delete(products)
        .where(and(eq(products.id, id), eq(products.businessId, session.user.businessId)));

    revalidatePath("/dashboard/products");
}
