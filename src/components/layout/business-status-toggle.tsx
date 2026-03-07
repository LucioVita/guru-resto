'use client';

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Power, PowerOff } from "lucide-react";

export function BusinessStatusToggle({ role }: { role: string }) {
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const isAdmin = role === 'business_admin' || role === 'super_admin';

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await fetch("/api/business/status");
                if (res.ok) {
                    const data = await res.json();
                    setIsOpen(data.isOpen);
                }
            } catch (error) {
                console.error("Failed to fetch business status:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    const handleToggle = async (checked: boolean) => {
        if (!isAdmin) {
            toast.error("Solo los administradores pueden cambiar el estado");
            return;
        }

        const previousState = isOpen;
        setIsOpen(checked);
        
        try {
            const res = await fetch("/api/business/status", {
                method: "POST", // Cambiado de PATCH a POST para mayor compatibilidad
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOpen: checked }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update status");
            }

            toast.success(checked ? "Pedidos activados (n8n ON)" : "Pedidos desactivados (n8n OFF)");
        } catch (error: any) {
            setIsOpen(previousState);
            toast.error(`Error: ${error.message}`);
        }
    };


    if (loading || isOpen === null) return null;

    return (
        <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4 border border-border/50">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {isOpen ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado n8n</p>
                    <p className="text-sm font-black">{isOpen ? "VENTA ABIERTA" : "VENTA CERRADA"}</p>
                </div>
            </div>
            <Switch
                checked={isOpen}
                onCheckedChange={handleToggle}
                id="n8n-status"
                className="data-[state=checked]:bg-green-500"
            />
        </div>
    );
}
