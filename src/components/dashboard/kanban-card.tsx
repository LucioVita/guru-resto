'use client';

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Printer, FileText, ChevronRight, ClipboardList, Utensils, Trash2, Timer, Send, Loader2, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrint } from "@/hooks/use-print";
import { useState } from "react";
import { confirmOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export function KanbanCard({ order, isOverlay, onStatusChange }: { order: any; isOverlay?: boolean; onStatusChange?: (id: string, status: string) => void }) {
    const { printOrder } = usePrint();
    const [waitMinutes, setWaitMinutes] = useState<number>(30);
    const [isConfirming, setIsConfirming] = useState(false);

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

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isConfirming) return;
        setIsConfirming(true);
        try {
            const result = await confirmOrder(order.id, waitMinutes);
            if (result.success) {
                toast.success(`✅ Pedido confirmado — ${waitMinutes} min notificados`);
                onStatusChange?.(order.id, 'preparation');
            } else {
                toast.error("Error: " + result.error);
            }
        } catch (err) {
            toast.error("Error al confirmar");
        } finally {
            setIsConfirming(false);
        }
    };

    // Lógica para mostrar solo algunos productos
    const displayedItems = order.items?.slice(0, 2) || [];
    const remainingCount = (order.items?.length || 0) - displayedItems.length;

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
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <span className="text-[10px] font-mono font-bold bg-gray-100 px-1 rounded">#{order.id.slice(-4)}</span>
                            <span className="text-xs font-bold text-gray-700 truncate flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {order.customer?.name || "Cliente"}
                            </span>
                        </div>

                        {/* DIRECCIÓN RESALTADA */}
                        <div className="mt-1 flex items-start gap-1 text-sm font-black text-gray-900 leading-tight">
                            <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span className="truncate">
                                {order.customer?.address || "Retiro en local"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span suppressHydrationWarning>
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                        </div>
                        <div className="text-sm font-black text-primary">${order.total}</div>
                    </div>
                </div>

                {/* BOTONES DE ESTADO RÁPIDO */}
                <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 rounded-full", order.status === 'pending' ? "bg-amber-500 text-white shadow-sm" : "text-gray-300 hover:bg-amber-50")}
                        onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'pending'); }}
                    >
                        <ClipboardList className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 rounded-full", order.status === 'preparation' ? "bg-blue-500 text-white shadow-sm" : "text-gray-300 hover:bg-blue-50")}
                        onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'preparation'); }}
                    >
                        <Utensils className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 rounded-full", order.status === 'ready' ? "bg-green-500 text-white shadow-sm" : "text-gray-300 hover:bg-green-50")}
                        onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'ready'); }}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar pedido?')) onStatusChange?.(order.id, 'cancelled'); }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* LISTA DE PRODUCTOS OPTIMIZADA */}
                <div className="space-y-1">
                    <div className="flex flex-col gap-1">
                        {displayedItems.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-[13px] text-gray-700 bg-gray-50/80 px-2 py-1 rounded border border-gray-100/50">
                                <span className="font-bold flex gap-2 overflow-hidden">
                                    <span className="text-primary shrink-0">{item.quantity}x</span>
                                    <span className="truncate">{item.name}</span>
                                </span>
                            </div>
                        ))}
                        {remainingCount > 0 && (
                            <p className="text-[10px] text-gray-400 italic font-medium pl-1">
                                + {remainingCount} producto{remainingCount > 1 ? 's' : ''} más...
                            </p>
                        )}
                        {(!order.items || order.items.length === 0) && (
                            <p className="text-xs text-gray-400 italic">Sin productos</p>
                        )}
                    </div>
                </div>

                {/* CAMPO DE DEMORA (solo pendientes) */}
                {order.status === 'pending' && (
                    <div
                        className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1.5"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex gap-1.5 items-center">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    min={1}
                                    value={waitMinutes}
                                    onChange={(e) => setWaitMinutes(Number(e.target.value))}
                                    className="w-full border border-amber-300 bg-white rounded-md px-2 py-1 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-amber-400 pr-8"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">min</span>
                            </div>
                            <Button
                                size="sm"
                                disabled={isConfirming}
                                onClick={handleConfirm}
                                className="h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                            >
                                {isConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ACCIONES DE IMPRESIÓN */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100" onPointerDown={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:bg-primary hover:text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); printOrder(order, 'comanda'); }}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:bg-primary hover:text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); printOrder(order, 'ticket'); }}
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>

                    {order.status === 'ready' ? (
                        <Button
                            size="sm"
                            className="h-8 gap-1 text-[10px] font-black bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => { e.stopPropagation(); onStatusChange?.(order.id, 'delivered'); }}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ENTREGAR
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod}
                            <ChevronRight className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
