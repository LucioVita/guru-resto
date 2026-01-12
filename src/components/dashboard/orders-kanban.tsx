'use client';

import { useState } from "react";
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/dashboard/kanban-column";
import { KanbanCard } from "@/components/dashboard/kanban-card";
import { updateOrderStatusAction } from "@/actions/order-actions";
import { toast } from "sonner";

const STAGES = [
    { id: "pending", title: "Pending" },
    { id: "preparation", title: "In Preparation" },
    { id: "ready", title: "Ready" },
    { id: "delivered", title: "Delivered" },
];

import { InvoiceDialog } from "@/components/orders/invoice-dialog";

export default function OrdersKanban({ initialOrders }: { initialOrders: any[] }) {
    const [orders, setOrders] = useState(initialOrders);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const orderId = active.id as string;
        const newStatus = over.id as any;

        const activeOrder = orders.find(o => o.id === orderId);
        if (activeOrder && activeOrder.status !== newStatus) {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

            try {
                await updateOrderStatusAction(orderId, newStatus);

                // If moved to delivered, ask for invoice
                if (newStatus === 'delivered' && !activeOrder.afipCae) {
                    setInvoiceOrder(activeOrder);
                    setInvoiceDialogOpen(true);
                }
            } catch (error) {
                toast.error("Failed to update status");
                setOrders(initialOrders); // Rollback
            }
        }

        setActiveId(null);
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[500px]">
                    {STAGES.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            id={stage.id}
                            title={stage.title}
                            orders={orders.filter((o) => o.status === stage.id)}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <KanbanCard order={orders.find((o) => o.id === activeId)} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <InvoiceDialog
                order={invoiceOrder}
                open={invoiceDialogOpen}
                onOpenChange={setInvoiceDialogOpen}
            />
        </>
    );
}
