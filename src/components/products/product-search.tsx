'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export default function ProductSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [query, setQuery] = useState(searchParams.get("query") || "");

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (query) {
                params.set("query", query);
            } else {
                params.delete("query");
            }
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [query, pathname, router, searchParams]);

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
                type="search"
                placeholder="Buscar productos..."
                className="pl-9 bg-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {isPending && <span className="absolute right-3 top-3 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
        </div>
    );
}
