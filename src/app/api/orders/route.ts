import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKey } from "@/lib/api-auth";
import { db } from "@/db";
import { apiKeys, customers, orders, orderItems, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Webhook fijo de n8n para cambios de estado y notificaciones al cliente
const N8N_STATUS_WEBHOOK = "https://n8n.resto.guruweb.com.ar/webhook/cambios-de-estado";

// Schema Validation for Incoming Order
const orderSchema = z.object({
    customer: z.object({
        name: z.string().min(1),
        phone: z.string().min(1), // Phone is critical for WhatsApp
        address: z.string().optional(),
    }),
    items: z.array(
        z.object({
            id: z.string().optional(), // Product ID if known
            name: z.string().min(1),
            quantity: z.number().min(1),
            price: z.number().min(0),
            notes: z.string().optional(),
        })
    ),
    total: z.number().min(0),
    status: z.enum(["pending", "preparation", "ready", "delivered", "cancelled"]).default("pending"),
    source: z.string().optional().default("whatsapp"),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication (x-api-key)
        const apiKeyHeader = req.headers.get("x-api-key");
        const businessId = await verifyApiKey(apiKeyHeader);

        if (!businessId) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing element x-api-key" },
                { status: 401 }
            );
        }

        // 2. Validate Body
        const body = await req.json();
        const validation = orderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation Error", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { customer, items, total, status, source } = validation.data;

        // 3. Process Order in Transaction
        // NOTE: MySQL2 doesn't support 'transaction' function nicely with drizzle in all versions/setups 
        // without some configuration, but typical usage:
        // We will do sequential operations for simplicity if transaction fails or connection pool issues occur, 
        // but ideally use db.transaction.

        // a. Find or Create Customer
        let customerId: string;

        // Check if customer exists by phone within this business
        const existingCustomer = await db.query.customers.findFirst({
            where: and(
                eq(customers.businessId, businessId),
                eq(customers.phone, customer.phone)
            )
        });

        if (existingCustomer) {
            customerId = existingCustomer.id;
            // Optional: Update address/name if changed? Let's just update address if provided
            if (customer.address && customer.address !== existingCustomer.address) {
                await db.update(customers)
                    .set({ address: customer.address, name: customer.name })
                    .where(eq(customers.id, customerId));
            }
        } else {
            const newCustomerValues = {
                id: crypto.randomUUID(),
                businessId,
                name: customer.name,
                phone: customer.phone,
                address: customer.address || "",
            };
            await db.insert(customers).values(newCustomerValues);
            customerId = newCustomerValues.id;
        }

        // b. Create Order
        const orderId = crypto.randomUUID();
        await db.insert(orders).values({
            id: orderId,
            businessId,
            customerId,
            status: status as any, // Cast to enum
            total: total.toString(), // Check schema type, decimal usually string in JS or number
            source,
            paymentMethod: 'cash', // Default or from body?
        });

        // c. Create Order Items
        if (items.length > 0) {
            const orderItemsValues = items.map(item => ({
                id: crypto.randomUUID(),
                orderId,
                productId: item.id || null, // null if ad-hoc
                name: item.name,
                quantity: item.quantity,
                price: item.price.toString(),
                notes: item.notes || "",
            }));
            await db.insert(orderItems).values(orderItemsValues);
        }

        // d. Fetch customer data for the initial notification (using joins for MariaDB compatibility)
        const orderRows = await db
            .select({
                order: orders,
                customer: customers
            })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(eq(orders.id, orderId));

        const orderData = orderRows[0];

        // e. Send initial automatic message to customer via n8n webhook
        // This tells the customer: "ok, ya te digo cuanto va a demorar"
        try {
            const initialPayload = {
                event: 'order_received',
                orderId,
                customer: {
                    name: orderData?.customer?.name || customer.name,
                    phone: orderData?.customer?.phone || customer.phone,
                    address: orderData?.customer?.address || customer.address,
                },
                items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                total,
                status: 'pending',
                estimatedWaitTime: null,
                message: 'ok, ya te digo cuanto va a demorar',
            };

            await fetch(N8N_STATUS_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialPayload),
            });
        } catch (webhookError) {
            // No fallamos el pedido si el webhook falla
            console.error("[Webhook] Error al enviar notificación inicial:", webhookError);
        }

        return NextResponse.json({
            success: true,
            message: "Order created successfully",
            orderId
        }, { status: 201 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// Handle CORS Preflight if needed, typically handled by middleware or next.config.ts headers.
// But for standard API routes, we can just return options.
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        },
    });
}
