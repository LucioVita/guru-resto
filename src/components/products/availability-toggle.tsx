'use client';

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleProductAvailabilityAction } from "@/actions/product-actions";
import { toast } from "sonner";

export default function AvailabilityToggle({ id, isAvailable }: { id: string; isAvailable: boolean }) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = (checked: boolean) => {
        startTransition(async () => {
            try {
                await toggleProductAvailabilityAction(id, checked);
                toast.success(checked ? "Product available" : "Product unavailable");
            } catch (error) {
                toast.error("Failed to update status");
            }
        });
    };

    return (
        <Switch
            checked={isAvailable}
            onCheckedChange={handleToggle}
            disabled={isPending}
        />
    );
}
