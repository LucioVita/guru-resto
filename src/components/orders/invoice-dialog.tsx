'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createOrderInvoiceAction } from "@/actions/order-actions";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

interface InvoiceDialogProps {
    order: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInvoiced?: () => void;
}

export function InvoiceDialog({ order, open, onOpenChange, onInvoiced }: InvoiceDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleCreateInvoice = async () => {
        if (!order) return;
        setLoading(true);
        try {
            const result = await createOrderInvoiceAction(order.id);
            if (result.success) {
                toast.success(`Invoice #${result.invoiceNumber} created successfully`);
                onOpenChange(false);
                if (onInvoiced) onInvoiced();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create invoice");
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Generate Invoice?</DialogTitle>
                    </div>
                    <DialogDescription>
                        Would you like to generate an AFIP electronic invoice for Order #{order.id.slice(-4)}?
                        Total amount: <span className="font-bold text-foreground">${order.total}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-gray-500">
                        This will connect to AFIP and retrieve a CAE. Make sure your AFIP settings are correctly configured in the dashboard.
                    </p>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Skip for now
                    </Button>
                    <Button onClick={handleCreateInvoice} disabled={loading} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Generate Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
