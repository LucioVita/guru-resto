'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addProductAction, updateProductAction } from "@/actions/product-actions";
import { toast } from "sonner";

export default function ProductFormDialog({ children, product }: { children: React.ReactNode; product?: any }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            if (product) {
                await updateProductAction(product.id, formData);
                toast.success("Product updated");
            } else {
                await addProductAction(formData);
                toast.success("Product added");
            }
            setOpen(false);
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Producto' : 'Agregar Nuevo Producto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" defaultValue={product?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select name="category" defaultValue={product?.category || "Principal"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Principal">Principal</SelectItem>
                                <SelectItem value="Guarnicion">Guarnición</SelectItem>
                                <SelectItem value="Bebida">Bebida</SelectItem>
                                <SelectItem value="Postre">Postre</SelectItem>
                                <SelectItem value="Other">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Precio</Label>
                        <Input id="price" name="price" type="number" step="1" defaultValue={product?.price ? Math.round(parseFloat(product.price)) : ''} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (Ingredientes)</Label>
                        <Textarea id="description" name="description" defaultValue={product?.description} placeholder="Ingresa ingredientes o detalles del producto..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
