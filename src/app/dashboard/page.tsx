import { auth } from "@/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import OrdersKanban from "@/components/dashboard/orders-kanban";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const activeOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.businessId, session.user.businessId),
            ne(orders.status, 'cancelled')
        ),
        with: {
            customer: true,
            items: {
                with: {
                    product: true
                }
            }
        },
        orderBy: [desc(orders.createdAt)],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Live Orders</h1>
                <Link href="/dashboard/orders/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Order
                    </Button>
                </Link>
            </div>

            <OrdersKanban initialOrders={activeOrders} />
        </div>
    );
}
