'use server';

import { auth } from "@/auth";
import { db } from "@/db";
import { orders, orderItems, businesses, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Webhook fijo de n8n para notificar al cliente con el tiempo de demora
const N8N_STATUS_WEBHOOK = "https://n8n.resto.guruweb.com.ar/webhook/cambios-de-estado";

export async function confirmOrder(orderId: string, minutes: number) {
    const session = await auth();

    if (!session || !session.user || !session.user.businessId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Actualizar el pedido a "en preparación" con el tiempo estimado
        await db.update(orders)
            .set({
                status: 'preparation',
                estimatedWaitTime: minutes
            })
            .where(eq(orders.id, orderId));

        // 2. Obtener datos completos del pedido (usando joins para compatibilidad con MariaDB)
        const orderRows = await db
            .select({
                order: orders,
                customer: customers,
                business: businesses
            })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .leftJoin(businesses, eq(orders.businessId, businesses.id))
            .where(eq(orders.id, orderId));

        if (orderRows.length === 0) {
            return { success: false, error: "Order not found" };
        }

        const data = orderRows[0];
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

        // 3. Disparar webhook a n8n con todos los datos del cliente y el tiempo de demora
        try {
            const payload = {
                event: 'order_confirmed',
                orderId: data.order.id,
                customer: {
                    name: data.customer?.name || 'Cliente',
                    phone: data.customer?.phone || '',
                    address: data.customer?.address || '',
                },
                items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                total: data.order.total,
                status: 'preparation',
                estimatedWaitTime: minutes,
                message: `Tu pedido ha sido confirmado. Tiempo estimado de demora: ${minutes} minutos.`,
                business: {
                    name: data.business?.name || '',
                    phone: data.business?.phone || '',
                },
            };

            const webhookRes = await fetch(N8N_STATUS_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!webhookRes.ok) {
                console.warn("[Webhook] n8n respondió con status:", webhookRes.status);
            }
        } catch (webhookError) {
            console.error("[Webhook] Error al notificar tiempo de demora:", webhookError);
        }

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error confirming order:", error);
        return { success: false, error: "Failed to confirm order" };
    }
}
