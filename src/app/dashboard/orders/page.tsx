import { auth } from "@/auth";
import { db } from "@/db";
import { orders, customers, orderItems, products, businesses } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { OrdersTable } from "@/components/orders/orders-table";
import ProductSearch from "@/components/products/product-search";

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    const session = await auth();
    if (!session || !session.user.businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <p className="text-gray-500">No se encontró información del negocio.</p>
            </div>
        );
    }

    const { query } = await searchParams;
    const lowerQuery = query?.toLowerCase() || "";

    // Fetch business info
    const [business] = await db.select().from(businesses).where(eq(businesses.id, session.user.businessId));

    // Fetch orders
    // Limit to 200 if search is present for better results
    const allOrders = await db.select({
        order: orders,
        customer: customers
    })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.businessId, session.user.businessId))
        .orderBy(desc(orders.createdAt))
        .limit(lowerQuery ? 200 : 100);

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

    let formattedOrders = allOrders.map(({ order, customer }) => {
        const items = allItems
            .filter((i) => i.item.orderId === order.id)
            .map((i) => ({
                ...i.item,
                product: i.product,
            }));

        return {
            ...order,
            customer,
            items,
            business // Include business info
        };
    });

    if (lowerQuery) {
        formattedOrders = formattedOrders.filter(o => {
            const matchesId = o.id.toLowerCase().includes(lowerQuery);
            const matchesCustomer = o.customer?.name?.toLowerCase().includes(lowerQuery);
            const matchesProducts = o.items.some(i => i.product?.name?.toLowerCase().includes(lowerQuery));
            return matchesId || matchesCustomer || matchesProducts;
        });
    }

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-20 -mt-6 -mx-6 px-6 pt-6 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Historial de Pedidos</h1>
                        <p className="text-gray-500 text-sm">Lista de los últimos pedidos recibidos</p>
                    </div>
                    <ProductSearch placeholder="Buscar por pedido, cliente o producto..." />
                </div>
            </div>

            <OrdersTable orders={formattedOrders} />
        </div>
    );
}
