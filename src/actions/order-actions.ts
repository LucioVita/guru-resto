'use server';

import { db } from "@/db";
import { orders, orderItems, customers, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendWebhook } from "@/lib/webhook";
import { businesses } from "@/db/schema";
import { createElectronicInvoice } from "@/lib/afip";

export async function createOrderInvoiceAction(orderId: string) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const [order] = await db.select().from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.businessId, session.user.businessId)));

    if (!order) throw new Error("Order not found");

    const [business] = await db.select().from(businesses).where(eq(businesses.id, session.user.businessId));
    const [customer] = order.customerId ? await db.select().from(customers).where(eq(customers.id, order.customerId)) : [null];

    // Combine for compatibility with existing code structure if beneficial, or just use variables
    const orderWithData = { ...order, business, customer };

    if (!orderWithData) throw new Error("Order not found");
    if (orderWithData.afipCae) throw new Error("Order already invoiced");

    // business is already fetched above
    if (!business) throw new Error("Business not found");
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

        // Fetch the updated order with relations for the return
        // We use manual selects again
        const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
        const [updatedCustomer] = updatedOrder.customerId ? await db.select().from(customers).where(eq(customers.id, updatedOrder.customerId)) : [null];
        const items = await db.select({
            item: orderItems,
            product: products
        })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, orderId));

        const formattedItems = items.map(({ item, product }) => ({ ...item, product }));

        const finalOrder = {
            ...updatedOrder,
            business,
            customer: updatedCustomer,
            items: formattedItems
        };

        revalidatePath("/dashboard");
        return { success: true, order: finalOrder };
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

    const [newOrder] = await db.select().from(orders).where(eq(orders.id, id));

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
    const [business] = await db.select().from(businesses).where(eq(businesses.id, session.user.businessId));

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
    const [business] = await db.select().from(businesses).where(eq(businesses.id, session.user.businessId));

    if (business?.webhookStatusUrl) {
        await sendWebhook(business.webhookStatusUrl, {
            event: 'order.status_updated',
            orderId,
            status
        });
    }
}
