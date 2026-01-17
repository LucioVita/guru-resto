import { auth } from "@/auth";
import { db } from "@/db";
import { orders, customers, orderItems, products } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { OrdersTable } from "@/components/orders/orders-table";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const session = await auth();
    if (!session || !session.user.businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <p className="text-gray-500">No se encontró información del negocio.</p>
            </div>
        );
    }

    // Fetch orders
    // Limit to 100 for performance on initial load
    const allOrders = await db.select({
        order: orders,
        customer: customers
    })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.businessId, session.user.businessId))
        .orderBy(desc(orders.createdAt))
        .limit(100);

    const orderIds = allOrders.map(o => o.order.id);

    // Fetch items
    let allItems: any[] = [];
    if (orderIds.length > 0) {
        allItems = await db
            .select({
                item: orderItems,
                product: products
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(inArray(orderItems.orderId, orderIds));
    }

    const formattedOrders = allOrders.map(({ order, customer }) => {
        const items = allItems
            .filter((i) => i.item.orderId === order.id)
            .map((i) => ({
                ...i.item,
                product: i.product,
            }));

        return {
            ...order,
            customer,
            items
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tighter">Historial de Pedidos</h1>
                <p className="text-gray-500 text-sm">Lista de los últimos pedidos recibidos</p>
            </div>

            <OrdersTable orders={formattedOrders} />
        </div>
    );
}
