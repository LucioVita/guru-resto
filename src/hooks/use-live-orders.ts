"use client";

import { useState, useEffect, useRef } from "react";
import { getLiveOrders } from "@/actions/order-actions";
import { toast } from "sonner"; // Assuming sonner is used for notifications based on package.json

export function useLiveOrders(initialData: any[] = []) {
    const [orders, setOrders] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio for notifications
        audioRef.current = new Audio("/notification.mp3"); // Ensure this file exists in public/
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchOrders = async () => {
            try {
                // setIsLoading(true); // Don't trigger loading state on background polls to avoid flickering
                const newOrders = await getLiveOrders();

                if (isMounted) {
                    setOrders((prevOrders) => {
                        // Check for new orders to trigger sound/notification
                        if (newOrders.length > prevOrders.length) {
                            // Determine if there are actual NEW orders by ID comparison for robustness
                            const prevIds = new Set(prevOrders.map(o => o.id));
                            const hasRealNew = newOrders.some(o => !prevIds.has(o.id));

                            if (hasRealNew) {
                                toast.success("¡Nuevo pedido recibido!");
                                if (audioRef.current) {
                                    audioRef.current.play().catch(e => console.log("Audio play failed interaction", e));
                                }
                            }
                        }
                        return newOrders;
                    });
                }
            } catch (error) {
                console.error("Polling error:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // Initial fetch if needed, but usually we pass initialData
        // fetchOrders();

        // Poll every 10 seconds
        const intervalId = setInterval(fetchOrders, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return { orders, isLoading };
}
