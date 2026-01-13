'use client';

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "@/components/dashboard/kanban-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    orders: any[];
    count: number;
    color: string;
    onStatusChange?: (orderId: string, newStatus: string) => void;
}

export function KanbanColumn({ id, title, orders, count, color, onStatusChange }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col gap-4 rounded-2xl p-4 transition-all duration-200 border-2",
                color,
                isOver ? "ring-2 ring-primary ring-offset-2 scale-[1.01]" : "shadow-sm"
            )}
        >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-black/5">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm tracking-tight">{title}</h3>
                </div>
                <span className="text-[10px] font-bold bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full border shadow-sm text-gray-600">
                    {count} {count === 1 ? 'pedido' : 'pedidos'}
                </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 min-h-[150px]">
                {orders.map((order) => (
                    <KanbanCard
                        key={order.id}
                        order={order}
                        onStatusChange={onStatusChange}
                    />
                ))}
            </div>
        </div>
    );
}


