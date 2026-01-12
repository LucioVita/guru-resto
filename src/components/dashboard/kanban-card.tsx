'use client';

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrint } from "@/hooks/use-print";

export function KanbanCard({ order, isOverlay }: { order: any; isOverlay?: boolean }) {
    const { printOrder } = usePrint();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: order.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
                isDragging && "opacity-50",
                isOverlay && "shadow-xl border-primary"
            )}
        >
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <span className="font-bold text-sm">Order #{order.id.slice(-4)}</span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-medium text-gray-600">
                        {order.customer?.name || "Anonymous Customer"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {order.items?.map((item: any) => (
                            <span key={item.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border">
                                {item.quantity}x {item.product?.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); printOrder(order, 'comanda'); }}
                            title="Print Comanda"
                        >
                            <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); printOrder(order, 'ticket'); }}
                            title="Print Ticket"
                        >
                            <Printer className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-primary">${order.total}</div>
                        <div className="text-[10px] capitalize text-gray-500">{order.paymentMethod}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
