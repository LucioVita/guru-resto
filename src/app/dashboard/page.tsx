import { auth } from "@/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import OrdersKanban from "@/components/dashboard/orders-kanban";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    // Only fetch orders that are in active states for the Kanban board
    const activeOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.businessId, session.user.businessId),
            inArray(orders.status, ['pending', 'preparation', 'ready'])
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
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Panel de Control</h1>
                    <p className="text-gray-500 text-sm">Gestiona tus pedidos en tiempo real</p>
                </div>
                <Link href="/dashboard/orders/new">
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4" />
                        Nuevo Pedido
                    </Button>
                </Link>
            </div>

            <OrdersKanban initialOrders={activeOrders} />
        </div>
    );
}

