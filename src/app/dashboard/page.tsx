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

    if (!session) return null;

    if (!session.user.businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 max-w-md">
                    <h2 className="text-xl font-bold text-amber-800 mb-2">Configuración Requerida</h2>
                    <p className="text-amber-700 text-sm">
                        Tu usuario no tiene un negocio asignado todavía. Por favor, contacta al administrador o configura tu negocio en los ajustes.
                    </p>
                </div>
            </div>
        );
    }

    // Fetch orders with manual joins to avoid LATERAL JOIN issues in MariaDB
    const activeOrders = await db
        .select()
        .from(orders)
        .where(
            and(
                eq(orders.businessId, session.user.businessId),
                inArray(orders.status, ['pending', 'preparation', 'ready'])
            )
        )
        .orderBy(desc(orders.createdAt));

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

