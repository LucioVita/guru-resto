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
                    <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={product?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" defaultValue={product?.category || "Principal"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Principal">Principal</SelectItem>
                                <SelectItem value="Guarnicion">Guarnicion</SelectItem>
                                <SelectItem value="Bebida">Bebida</SelectItem>
                                <SelectItem value="Postre">Postre</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Ingredients)</Label>
                        <Textarea id="description" name="description" defaultValue={product?.description} placeholder="Enter ingredients or product details..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
