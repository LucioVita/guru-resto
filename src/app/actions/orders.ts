'use server';

import { auth } from "@/auth";
import { db } from "@/db";
import { orders, orderItems, businesses, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Webhook fijo de n8n solicitado
const N8N_STATUS_WEBHOOK = "https://n8n.resto.guruweb.com.ar/webhook/cambios-de-estado";

export async function confirmOrder(orderId: string, minutes: number) {
    const session = await auth();

    if (!session || !session.user || !session.user.businessId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Actualizar el pedido
        await db.update(orders)
            .set({
                status: 'preparation',
                estimatedWaitTime: minutes
            })
            .where(eq(orders.id, orderId));

        // 2. Obtener datos para el webhook
        const orderRows = await db
            .select({
                order: orders,
                customer: customers,
            })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(eq(orders.id, orderId));

        if (orderRows.length === 0) return { success: false, error: "Order not found" };

        const data = orderRows[0];

        // 3. Enviar el JSON simplificado solicitado
        const payload = {
            event: 'order_confirmed',
            orderId: data.order.id,
            phone: data.customer?.phone || '',
            name: data.customer?.name || '',
            estimatedWaitTime: minutes,
            status: 'preparation'
        };

        try {
            await fetch(N8N_STATUS_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            console.error("Error sending fixed webhook:", e);
        }

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error confirming order:", error);
        return { success: false, error: "Failed to confirm order" };
    }
}
