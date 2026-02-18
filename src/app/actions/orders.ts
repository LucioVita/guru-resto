'use server';

import { auth } from "@/auth";
import { db } from "@/db";
import { orders, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function confirmOrder(orderId: string, minutes: number) {
    const session = await auth();

    if (!session || !session.user || !session.user.businessId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Update Order
        await db.update(orders)
            .set({
                status: 'preparation',
                estimatedWaitTime: minutes
            })
            .where(eq(orders.id, orderId));

        // 2. Fetch Order & Business Details for Notification
        const orderData = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                customer: true,
                business: true
            }
        });

        if (!orderData) {
            return { success: false, error: "Order not found" };
        }

        // 3. Notify via Webhook (if configured)
        if (orderData.business && orderData.business.webhookUrl) {
            try {
                // Determine source to customize message payload if needed, 
                // but generally just send the event.
                const payload = {
                    event: 'order_confirmed',
                    orderId: orderData.id,
                    customer: {
                        name: orderData.customer?.name,
                        phone: orderData.customer?.phone,
                    },
                    status: 'preparation',
                    estimatedWaitTime: minutes,
                    message: `Tu pedido ha sido confirmado. Tiempo estimado de demora: ${minutes} minutos.`
                };

                await fetch(orderData.business.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (webhookError) {
                console.error("Failed to send webhook notification:", webhookError);
                // We don't fail the action if webhook fails, but we might want to log it
            }
        }

        revalidatePath('/dashboard/orders');
        return { success: true };
    } catch (error) {
        console.error("Error confirming order:", error);
        return { success: false, error: "Failed to confirm order" };
    }
}
