'use client';

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "@/components/dashboard/kanban-card";
import { cn } from "@/lib/utils";

export function KanbanColumn({ id, title, orders }: { id: string; title: string; orders: any[] }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col gap-4 rounded-xl bg-gray-200/50 p-4 transition-colors",
                isOver && "bg-gray-300/50"
            )}
        >
            <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{title}</h3>
                <span className="text-xs font-semibold bg-white px-2 py-0.5 rounded-full border shadow-sm">
                    {orders.length}
                </span>
            </div>
            <div className="flex flex-1 flex-col gap-3">
                {orders.map((order) => (
                    <KanbanCard key={order.id} order={order} />
                ))}
            </div>
        </div>
    );
}
