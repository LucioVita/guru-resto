'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOrderAction } from "@/actions/order-actions";
import { toast } from "sonner";
import { Trash2, Plus, Minus } from "lucide-react";

export default function OrderForm({ products }: { products: any[] }) {
    const router = useRouter();
    const [cart, setCart] = useState<{ productId: string; quantity: number; name: string; price: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [customerName, setCustomerName] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    const total = useMemo(() => {
        return cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    }, [cart]);

    const addToCart = (product: any) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { productId: product.id, quantity: 1, name: product.name, price: product.price }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((i) => i.productId !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) =>
            prev.map((i) =>
                i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
            )
        );
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }

        setLoading(true);
        try {
            await createOrderAction({
                customerId: null,
                items: cart,
                total: total.toFixed(2),
                paymentMethod,
            });
            toast.success("Pedido creado exitosamente");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Error al crear el pedido");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Seleccionar Productos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map((product) => (
                                <Button
                                    key={product.id}
                                    variant="outline"
                                    className="h-auto flex-col items-start p-4 gap-1 hover:border-primary"
                                    onClick={() => addToCart(product)}
                                    disabled={!product.isAvailable}
                                >
                                    <span className="font-bold">{product.name}</span>
                                    <span className="text-sm text-gray-600 font-semibold">${Math.round(parseFloat(product.price))}</span>
                                    {!product.isAvailable && <span className="text-[10px] text-red-500 uppercase">No disponible</span>}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle>Pedido Actual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Customer Information */}
                        <div className="space-y-3 pb-4 border-b">
                            <h3 className="font-semibold text-sm">Datos del Cliente</h3>
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Nombre</Label>
                                <Input
                                    id="customerName"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Nombre del cliente"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerPhone">Teléfono</Label>
                                <Input
                                    id="customerPhone"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Teléfono de contacto"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerAddress">Dirección</Label>
                                <Input
                                    id="customerAddress"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    placeholder="Dirección de entrega"
                                />
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.productId} className="flex items-center justify-between text-sm">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-gray-600 font-semibold">${Math.round(parseFloat(item.price))}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border rounded-md">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, -1)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, 1)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.productId)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <p className="text-center py-8 text-gray-500 text-sm">El carrito está vacío</p>
                            )}
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Método de Pago</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Efectivo</SelectItem>
                                        <SelectItem value="transfer">Transferencia</SelectItem>
                                        <SelectItem value="card">Tarjeta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-between items-end font-bold text-xl pt-4">
                                <span>Total</span>
                                <span>${Math.round(total)}</span>
                            </div>

                            <Button className="w-full h-12 text-lg" disabled={loading || cart.length === 0} onClick={handleSubmit}>
                                {loading ? "Procesando..." : "Confirmar Pedido"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
