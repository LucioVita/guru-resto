'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createOrderInvoiceAction } from "@/actions/order-actions";
import { toast } from "sonner";
import { Loader2, FileText, Printer, CheckCircle2 } from "lucide-react";
import { usePrint } from "@/hooks/use-print";

interface InvoiceDialogProps {
    order: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInvoiced?: () => void;
}

export function InvoiceDialog({ order, open, onOpenChange, onInvoiced }: InvoiceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [invoicedOrder, setInvoicedOrder] = useState<any | null>(null);
    const { printOrder } = usePrint();

    const handleCreateInvoice = async () => {
        if (!order) return;
        setLoading(true);
        try {
            const result = await createOrderInvoiceAction(order.id);
            if (result.success && result.order) {
                toast.success(`Factura #${result.order.afipInvoiceNumber} generada correctamente`);
                setInvoicedOrder(result.order);
                setSuccess(true);
                if (onInvoiced) onInvoiced();
            }
        } catch (error: any) {
            toast.error(error.message || "Error al crear la factura");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (invoicedOrder) {
            printOrder(invoicedOrder, 'factura');
            onOpenChange(false);
            // Reset success state after closing
            setTimeout(() => setSuccess(false), 500);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) setTimeout(() => setSuccess(false), 300);
        }}>
            <DialogContent className="sm:max-w-[425px]">
                {!success ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <DialogTitle>¿Generar Factura AFIP?</DialogTitle>
                            </div>
                            <DialogDescription>
                                ¿Deseas generar la factura electrónica para el Pedido #{order.id.slice(-4)}?<br />
                                Monto total: <span className="font-bold text-foreground">${order.total}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                Se conectará con AFIP para obtener el CAE. Asegúrate de tener los datos del negocio configurados.
                            </p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                                Omitir
                            </Button>
                            <Button onClick={handleCreateInvoice} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                Generar Factura
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex flex-col items-center justify-center py-4 space-y-4">
                                <div className="p-4 bg-green-100 rounded-full animate-bounce">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <div className="text-center">
                                    <DialogTitle className="text-xl">¡Factura Generada!</DialogTitle>
                                    <DialogDescription className="mt-2">
                                        Se ha obtenido el CAE con éxito para el comprobante<br />
                                        <span className="font-black text-gray-900">
                                            {String(invoicedOrder?.afipInvoicePuntoVenta).padStart(5, '0')}-{String(invoicedOrder?.afipInvoiceNumber).padStart(8, '0')}
                                        </span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-center flex-col gap-3">
                            <Button onClick={handlePrint} className="w-full gap-2 h-12 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary.90">
                                <Printer className="h-5 w-5" />
                                IMPRIMIR FACTURA (80mm)
                            </Button>
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">
                                Cerrar sin imprimir
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

