import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Users, Package, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Orders" },
    { href: "/dashboard/products", icon: Package, label: "Products" },
    { href: "/dashboard/customers", icon: Users, label: "Customers" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ role }: { role: string }) {
    return (
        <aside className="hidden w-64 flex-col border-r bg-card md:flex">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-xl font-bold">Guru-Resto</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
