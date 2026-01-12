import { auth } from "@/auth";
import { getOpenCaja } from "@/actions/cash-actions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openCajaAction, closeCajaAction } from "@/actions/cash-actions";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogIn, LogOut, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function CashRegisterPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const openCaja = await getOpenCaja();

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Cash Register (Caja)</h1>
                <Badge variant={openCaja ? "outline" : "destructive"} className={cn("text-sm px-3 py-1", openCaja && "bg-green-100 text-green-700 border-green-200")}>
                    {openCaja ? "OPEN" : "CLOSED"}
                </Badge>
            </div>

            {!openCaja ? (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LogIn className="h-5 w-5 text-primary" />
                            Open New Session
                        </CardTitle>
                    </CardHeader>
                    <form action={async (formData) => {
                        "use server";
                        const amount = formData.get("amount") as string;
                        await openCajaAction(amount);
                    }}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Initial Cash (Fondo Inicial)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <Input id="amount" name="amount" type="number" step="0.01" className="pl-8" placeholder="0.00" required />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full h-12 text-lg">Open Caja</Button>
                        </CardFooter>
                    </form>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-primary" />
                                Current Session Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Opened At</span>
                                <span className="font-medium">{new Date(openCaja.openingTime).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Opened By</span>
                                <span className="font-medium">User #{openCaja.openedById.slice(-4)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Initial Amount</span>
                                <span className="font-bold text-lg">${openCaja.initialAmount}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LogOut className="h-5 w-5 text-destructive" />
                                Close Session (Arqueo)
                            </CardTitle>
                        </CardHeader>
                        <form action={async (formData) => {
                            "use server";
                            const amount = formData.get("actualAmount") as string;
                            const notes = formData.get("notes") as string;
                            await closeCajaAction({ actualAmount: amount, notes });
                        }}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="actualAmount">Actual Cash in Drawer</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <Input id="actualAmount" name="actualAmount" type="number" step="0.01" className="pl-8" placeholder="Counted cash..." required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Closing Notes</Label>
                                    <Input id="notes" name="notes" placeholder="Any differences or comments..." />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" variant="destructive" className="w-full h-12 text-lg">Close Caja</Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )}

            {openCaja && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-8 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                Live Sales Summary
                            </h3>
                            <p className="text-sm text-gray-500">Total accumulated sales since opening.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-primary">Calculated Automatically</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
