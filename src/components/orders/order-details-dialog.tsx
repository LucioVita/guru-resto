'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { usePrint } from "@/hooks/use-print";
import { useState } from "react";
import { confirmOrder } from "@/app/actions/orders";

export function OrderDetailsDialog({ order, open, onOpenChange }: { order: any; open: boolean; onOpenChange: (open: boolean) => void }) {
    const { printOrder } = usePrint();

    const [timeEstimate, setTimeEstimate] = useState<number>(30);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!order) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            // Dynamically import the action or assume it's available
            const actionResult = await confirmOrder(order.id, timeEstimate);
            if (actionResult.success) {
                onOpenChange(false);
                // Ideally show toast or success message
            } else {
                console.error("Error confirming order:", actionResult.error);
                // Ideally show error message
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Detalle del Pedido #{order.id.slice(-4)}</DialogTitle>
                    <DialogDescription>
                        Creado el {new Date(order.createdAt).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1 text-gray-900 border border-gray-100">
                        <p><strong className="text-gray-700">Cliente:</strong> {order.customer?.name || 'Cliente de paso'}</p>
                        {order.customer?.phone && <p><strong className="text-gray-700">Teléfono:</strong> {order.customer.phone}</p>}
                        {order.customer?.address && <p><strong className="text-gray-700">Dirección:</strong> {order.customer.address}</p>}
                    </div>

                    <div className="border rounded-lg overflow-hidden border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr className="text-left">
                                    <th className="p-2 font-bold">Cant</th>
                                    <th className="p-2 font-bold">Producto</th>
                                    <th className="p-2 text-right font-bold">Precio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {order.items?.map((item: any) => (
                                    <tr key={item.id} className="text-gray-900">
                                        <td className="p-2 font-medium">{item.quantity}x</td>
                                        <td className="p-2">{item.product?.name || item.name}</td>
                                        <td className="p-2 text-right text-gray-700 font-mono">${item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold text-gray-900">
                                <tr>
                                    <td colSpan={2} className="p-2 text-right">Total:</td>
                                    <td className="p-2 text-right">${order.total}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {order.status === 'pending' && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Confirmar Pedido</h4>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-blue-800">Tiempo de Demora (minutos):</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="5"
                                        className="border rounded px-2 py-1 flex-1 text-sm"
                                        value={timeEstimate}
                                        onChange={(e) => setTimeEstimate(Number(e.target.value))}
                                    />
                                    <Button
                                        onClick={handleConfirm}
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isSubmitting ? 'Confirmando...' : 'Confirmar y Notificar'}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-blue-600/80 mt-1">
                                    Se enviará una notificación automática al cliente con el tiempo de espera.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 mt-4">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => printOrder(order, 'comanda')}
                        >
                            <FileText className="h-4 w-4" />
                            Comanda
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => printOrder(order, 'ticket')}
                        >
                            <Printer className="h-4 w-4" />
                            Ticket
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
