'use client';

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { OrderDetailsDialog } from "./order-details-dialog";
import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800' },
    preparation: { label: 'En Preparación', color: 'bg-blue-100 text-blue-800' },
    ready: { label: 'Listo', color: 'bg-green-100 text-green-800' },
    delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export function OrdersTable({ orders }: { orders: any[] }) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const handleView = (order: any) => {
        setSelectedOrder(order);
        setDetailOpen(true);
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[100px] text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                No hay pedidos registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => handleView(order)}>
                                <TableCell className="font-medium">
                                    #{order.id.slice(-4)}
                                </TableCell>
                                <TableCell>
                                    {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell>
                                    {order.customer?.name || 'Cliente de paso'}
                                </TableCell>
                                <TableCell>
                                    {STATUS_MAP[order.status] ? (
                                        <Badge variant="secondary" className={STATUS_MAP[order.status].color}>
                                            {STATUS_MAP[order.status].label}
                                        </Badge>
                                    ) : (
                                        order.status
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    ${order.total}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:text-blue-600"
                                        onClick={(e) => { e.stopPropagation(); handleView(order); }}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <OrderDetailsDialog
                order={selectedOrder}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />
        </div>
    );
}
