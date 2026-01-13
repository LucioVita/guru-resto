'use client';

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/dashboard/kanban-column";
import { KanbanCard } from "@/components/dashboard/kanban-card";
import { updateOrderStatusAction } from "@/actions/order-actions";
import { toast } from "sonner";
import { InvoiceDialog } from "@/components/orders/invoice-dialog";

const STAGES = [
    { id: "pending", title: "Pendiente", color: "border-amber-500" },
    { id: "preparation", title: "En Preparación", color: "border-blue-500" },
    { id: "ready", title: "Listos para Entregar", color: "border-green-500" },
];

export default function OrdersKanban({ initialOrders }: { initialOrders: any[] }) {
    const router = useRouter();
    const [orders, setOrders] = useState(initialOrders);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

    // Sync state with props when initialOrders changes (e.g., after a refresh)
    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    // Polling for real-time updates (since we are not using WebSockets yet)
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 10000); // Refresh data every 10 seconds
        return () => clearInterval(interval);
    }, [router]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Filter orders using useMemo for performance (as suggested in reference)
    const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
    const preparationOrders = useMemo(() => orders.filter(o => o.status === 'preparation'), [orders]);
    const readyOrders = useMemo(() => orders.filter(o => o.status === 'ready'), [orders]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        const activeOrder = orders.find(o => o.id === orderId);
        if (!activeOrder || activeOrder.status === newStatus) return;

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        try {
            await updateOrderStatusAction(orderId, newStatus as any);

            // If moved to delivered/completed, we might want to refresh fully
            if (newStatus === 'delivered') {
                toast.success("Pedido entregado");
                if (!activeOrder.afipCae) {
                    setInvoiceOrder(activeOrder);
                    setInvoiceDialogOpen(true);
                }
            }
        } catch (error) {
            toast.error("Error al actualizar el estado");
            setOrders(initialOrders); // Rollback
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const orderId = active.id as string;
        const newStatus = over.id as string;

        if (newStatus !== "pending" && newStatus !== "preparation" && newStatus !== "ready") {
            // If dropped on an item instead of a column, exit
            return;
        }

        await handleStatusChange(orderId, newStatus);
        setActiveId(null);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
                    <KanbanColumn
                        id="pending"
                        title="Pendiente"
                        orders={pendingOrders}
                        count={pendingOrders.length}
                        color="bg-amber-50/50 border-amber-200"
                        onStatusChange={handleStatusChange}
                    />
                    <KanbanColumn
                        id="preparation"
                        title="En Preparación"
                        orders={preparationOrders}
                        count={preparationOrders.length}
                        color="bg-blue-50/50 border-blue-200"
                        onStatusChange={handleStatusChange}
                    />
                    <KanbanColumn
                        id="ready"
                        title="Listos para Entregar"
                        orders={readyOrders}
                        count={readyOrders.length}
                        color="bg-green-50/50 border-green-200"
                        onStatusChange={handleStatusChange}
                    />
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="rotate-3 scale-105 transition-transform">
                            <KanbanCard
                                order={orders.find((o) => o.id === activeId)}
                                isOverlay
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <InvoiceDialog
                order={invoiceOrder}
                open={invoiceDialogOpen}
                onOpenChange={setInvoiceDialogOpen}
            />
        </div>
    );
}

