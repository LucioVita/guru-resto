'use client';

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Printer, FileText, ChevronRight, MoreVertical, ClipboardList, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrint } from "@/hooks/use-print";

import { CheckCircle2 } from "lucide-react";

export function KanbanCard({ order, isOverlay, onStatusChange }: { order: any; isOverlay?: boolean; onStatusChange?: (id: string, status: string) => void }) {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'border-l-amber-500';
            case 'preparation': return 'border-l-blue-500';
            case 'ready': return 'border-l-green-500';
            default: return 'border-l-gray-300';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'preparation': return 'bg-blue-100 text-blue-700';
            case 'ready': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'preparation': return 'En Cocina';
            case 'ready': return 'Listo';
            default: return status;
        }
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group relative border-l-4 overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-[0.98]",
                getStatusColor(order.status),
                isDragging && "opacity-20",
                isOverlay && "shadow-2xl border-primary ring-2 ring-primary/20",
                "bg-white"
            )}
        >
            <CardContent className="p-3 space-y-3">
                <div className="flex justify-between items-start" onPointerDown={(e) => e.stopPropagation()}>
                    <div className="flex flex-col">
                        <span className="font-black text-lg tracking-tighter text-gray-900">#{order.id.slice(-4)}</span>
                        <div className="mt-1">
                            <div className="mt-1 flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6 rounded-full transition-all",
                                        order.status === 'pending'
                                            ? "bg-amber-500 text-white shadow-md hover:bg-amber-600 ring-2 ring-amber-200"
                                            : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'pending'); }}
                                    title="Pasar a Pendiente"
                                >
                                    <ClipboardList className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6 rounded-full transition-all",
                                        order.status === 'preparation'
                                            ? "bg-blue-500 text-white shadow-md hover:bg-blue-600 ring-2 ring-blue-200"
                                            : "text-gray-300 hover:text-blue-500 hover:bg-blue-50"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'preparation'); }}
                                    title="Pasar a Cocina"
                                >
                                    <Utensils className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6 rounded-full transition-all",
                                        order.status === 'ready'
                                            ? "bg-green-500 text-white shadow-md hover:bg-green-600 ring-2 ring-green-200"
                                            : "text-gray-300 hover:text-green-500 hover:bg-green-50"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'ready'); }}
                                    title="Pasar a Listo"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-bold text-gray-900">${order.total}</div>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex flex-col gap-1 mt-2">
                        {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-bold flex gap-2">
                                    <span className="text-primary">{item.quantity}x</span>
                                    <span className="truncate max-w-[140px]">{item.product?.name || "Producto"}</span>
                                </span>
                            </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                            <p className="text-xs text-gray-400 italic">Sin productos</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100" onPointerDown={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:bg-primary hover:text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); printOrder(order, 'comanda'); }}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:bg-primary hover:text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); printOrder(order, 'ticket'); }}
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>

                    {order.status === 'ready' ? (
                        <Button
                            size="sm"
                            className="h-8 gap-1.5 text-[11px] font-bold bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200"
                            onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'delivered'); }}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ENTREGAR
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod}
                            <ChevronRight className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
