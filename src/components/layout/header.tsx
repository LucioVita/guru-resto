import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default function Header({ user }: { user: any }) {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <form
                    action={async () => {
                        "use server";
                        await signOut();
                    }}
                >
                    <Button variant="outline" size="sm">Sign Out</Button>
                </form>
            </div>
        </header>
    );
}
