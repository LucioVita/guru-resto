'use server';

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendWebhook } from "@/lib/webhook";
import { businesses } from "@/db/schema";
import { createElectronicInvoice } from "@/lib/afip";

export async function createOrderInvoiceAction(orderId: string) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.businessId, session.user.businessId)),
        with: {
            business: true,
            customer: true,
        }
    });

    if (!order) throw new Error("Order not found");
    if (order.afipCae) throw new Error("Order already invoiced");

    const business = order.business;
    if (!business.afipCuit || !business.afipToken) {
        throw new Error("AFIP not configured for this business. Please check Settings.");
    }

    try {
        const invoiceData = await createElectronicInvoice(
            {
                tax_id: business.afipCuit,
                token: business.afipToken,
                environment: business.afipEnvironment as 'dev' | 'prod',
                wsid: 'wsfe',
                cert: business.afipCertificate || undefined,
                key: business.afipPrivateKey || undefined,
            },
            {
                puntoVenta: business.afipPuntoVenta || 1,
                tipoComprobante: 11, // Default to Factura C for now (Monotributo)
                concepto: 1, // Products
                docTipo: 99, // Final Consumer
                docNro: 0,
                impTotal: parseFloat(order.total),
            }
        );

        await db.update(orders)
            .set({
                afipCae: invoiceData.cae,
                afipCaeExpiration: invoiceData.caeExpiration ? new Date(
                    invoiceData.caeExpiration.substring(0, 4) + '-' +
                    invoiceData.caeExpiration.substring(4, 6) + '-' +
                    invoiceData.caeExpiration.substring(6, 8)
                ) : null,
                afipInvoiceNumber: invoiceData.invoiceNumber,
                afipInvoiceType: 11,
                afipInvoicePuntoVenta: business.afipPuntoVenta || 1,
                afipInvoicedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        const updatedOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                business: true,
                customer: true,
                items: {
                    with: {
                        product: true
                    }
                }
            }
        });

        revalidatePath("/dashboard");
        return { success: true, order: updatedOrder };
    } catch (error: any) {
        console.error("AFIP Error:", error);
        throw new Error(error.message || "Failed to generate AFIP invoice");
    }
}


export async function createOrderAction(data: {
    customerId: string | null;
    items: { productId: string; quantity: number; price: string }[];
    total: string;
    paymentMethod: string;
}) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const id = crypto.randomUUID();
    await db.insert(orders).values({
        id,
        businessId: session.user.businessId,
        customerId: data.customerId,
        total: data.total,
        paymentMethod: data.paymentMethod,
        status: 'pending',
    });

    const newOrder = await db.query.orders.findFirst({
        where: eq(orders.id, id),
    });

    if (newOrder) {
        await db.insert(orderItems).values(
            data.items.map(item => ({
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            }))
        );
    }

    revalidatePath("/dashboard");

    // Trigger Webhook
    const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, session.user.businessId),
    });

    if (business?.webhookUrl) {
        await sendWebhook(business.webhookUrl, {
            event: 'order.created',
            order: newOrder,
            items: data.items
        });
    }

    return newOrder;
}

export async function updateOrderStatusAction(orderId: string, status: any) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    await db.update(orders)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(orders.id, orderId), eq(orders.businessId, session.user.businessId)));

    revalidatePath("/dashboard");

    // Trigger Webhook
    const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, session.user.businessId),
    });

    if (business?.webhookStatusUrl) {
        await sendWebhook(business.webhookStatusUrl, {
            event: 'order.status_updated',
            orderId,
            status
        });
    }
}
