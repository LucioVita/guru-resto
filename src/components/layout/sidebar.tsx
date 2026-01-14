'use client';

import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Users, Package, Settings, Calculator, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Tablero" },
    { href: "/dashboard/orders/new", icon: ShoppingCart, label: "Tomar Pedido" },
    { href: "/dashboard/products", icon: Package, label: "Productos" },
    { href: "/dashboard/customers", icon: Users, label: "Clientes" },
    { href: "/dashboard/settings/afip", icon: FileText, label: "Facturación" },
    { href: "/dashboard/cash-register", icon: Calculator, label: "Caja" },
    { href: "/dashboard/settings", icon: Settings, label: "Ajustes", restrictedTo: ["super_admin"] },
];

export default function Sidebar({ role }: { role: string }) {
    const pathname = usePathname();

    // Filter items based on user role
    const visibleItems = items.filter(item => {
        if (item.restrictedTo) {
            return item.restrictedTo.includes(role);
        }
        return true;
    });

    return (
        <aside className="hidden w-60 flex-col border-r bg-card md:flex">
            <div className="flex h-16 items-center border-b px-8">
                <span className="text-2xl font-black tracking-tighter text-primary italic">GURU RESTO</span>
            </div>
            <nav className="flex-1 space-y-1.5 p-6">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-6 border-t">
                <a
                    href="https://www.guruweb.com.ar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity"
                >
                    <img
                        src="/guruweb-logo.png"
                        alt="GuruWeb Logo"
                        className="h-10 w-auto"
                    />
                </a>
            </div>
        </aside>
    );
}

