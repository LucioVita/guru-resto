import { auth } from "@/auth";
import { getOpenCaja, getCajaHistory, downloadCajaReportAction } from "@/actions/cash-actions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openCajaAction, closeCajaAction } from "@/actions/cash-actions";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogIn, LogOut, Receipt, History, Download, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function CashRegisterPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const openCaja = await getOpenCaja();
    const isAdmin = session.user.role === 'business_admin' || session.user.role === 'super_admin';
    const history = isAdmin ? await getCajaHistory() : [];

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8 px-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Caja Registradora</h1>
                    <p className="text-gray-500 text-sm">Gestiona el flujo de efectivo y ventas diarias</p>
                </div>
                <Badge variant={openCaja ? "outline" : "destructive"} className={cn("text-sm px-3 py-1 font-bold", openCaja && "bg-green-100 text-green-700 border-green-200")}>
                    {openCaja ? "ABIERTA" : "CERRADA"}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {!openCaja ? (
                    <Card className="shadow-lg border-2 border-primary/10">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="flex items-center gap-2 text-primary font-black italic tracking-tighter">
                                <LogIn className="h-5 w-5" />
                                ABRIR NUEVA SESIÓN
                            </CardTitle>
                        </CardHeader>
                        <form action={async (formData) => {
                            "use server";
                            const amount = formData.get("amount") as string;
                            await openCajaAction(amount);
                        }}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="font-bold">Efectivo Inicial (Fondo)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                                        <Input id="amount" name="amount" type="number" step="1" className="pl-8 h-12 text-lg font-bold" placeholder="0" required />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full h-12 text-lg font-black tracking-tighter shadow-lg shadow-primary/20">ABRIR CAJA</Button>
                            </CardFooter>
                        </form>
                    </Card>
                ) : (
                    <>
                        <Card className="shadow-md border-primary/10">
                            <CardHeader className="bg-gray-50/50">
                                <CardTitle className="flex items-center gap-2 text-gray-700 font-black italic tracking-tighter text-base">
                                    <Wallet className="h-5 w-5 text-primary" />
                                    SESIÓN ACTUAL
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4 font-medium">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-400 text-xs uppercase">Apertura</span>
                                    <span className="text-sm">{new Date(openCaja.openingTime).toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-400 text-xs uppercase">Fondo Inicial</span>
                                    <span className="text-lg font-black text-primary">${Math.round(parseFloat(openCaja.initialAmount))}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-destructive/10">
                            <CardHeader className="bg-destructive/5">
                                <CardTitle className="flex items-center gap-2 text-destructive font-black italic tracking-tighter text-base">
                                    <LogOut className="h-5 w-5" />
                                    CERRAR SESIÓN
                                </CardTitle>
                            </CardHeader>
                            <form action={async (formData) => {
                                "use server";
                                const amount = formData.get("actualAmount") as string;
                                const notes = formData.get("notes") as string;
                                await closeCajaAction({ actualAmount: amount, notes });
                            }}>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="actualAmount" className="font-bold">Efectivo Real Contado</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-destructive font-bold">$</span>
                                            <Input id="actualAmount" name="actualAmount" type="number" step="1" className="pl-8 h-12 text-lg font-bold" placeholder="Monto en mano..." required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notas</Label>
                                        <Input id="notes" name="notes" placeholder="¿Alguna diferencia?" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" variant="destructive" className="w-full h-12 text-lg font-black tracking-tighter shadow-lg shadow-destructive/20 uppercase">Cerrar y Generar Reporte</Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </>
                )}

                {!openCaja && !isAdmin && (
                    <Card className="md:col-span-2 bg-amber-50 border-amber-200">
                        <CardContent className="p-12 text-center space-y-2">
                            <History className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-20" />
                            <h3 className="text-amber-900 font-bold uppercase tracking-tight">Historial Reservado</h3>
                            <p className="text-amber-700 text-sm">Solo los administradores pueden ver el historial de cajas anteriores.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {isAdmin && history.length > 0 && (
                <div className="space-y-4 pt-8">
                    <h2 className="text-xl font-black italic text-gray-800 tracking-tighter flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        HISTORIAL DE CAJAS (Últimas 20)
                    </h2>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-gray-400 px-6">Apertura / Cierre</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-gray-400">Fondos</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-gray-400">Total Venta</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-wider text-gray-400 text-right px-6">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((caja) => (
                                    <TableRow key={caja.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">{new Date(caja.openingTime).toLocaleDateString('es-AR')}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(caja.openingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {caja.closingTime ? new Date(caja.closingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span className="text-gray-400">Inic: <span className="text-gray-700 font-bold">${Math.round(parseFloat(caja.initialAmount))}</span></span>
                                                <span className="text-gray-400">Real: <span className="text-gray-700 font-bold">${Math.round(parseFloat(caja.finalAmountActual || "0"))}</span></span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-primary font-black text-base">
                                                ${Math.round(parseFloat(caja.finalAmountCalculated || "0") - parseFloat(caja.initialAmount))}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            {caja.status === 'closed' ? (
                                                <form action={async () => {
                                                    "use server";
                                                    await downloadCajaReportAction(caja.id);
                                                }}>
                                                    <Button variant="outline" size="sm" className="gap-2 font-bold text-xs h-9 border-primary/20 hover:bg-primary/5 text-primary">
                                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                                        Descargar CSV
                                                    </Button>
                                                </form>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">ACTIVA</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
