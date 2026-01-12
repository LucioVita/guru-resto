import { auth } from "@/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import ProductFormDialog from "@/components/products/product-form-dialog";
import AvailabilityToggle from "@/components/products/availability-toggle";

export default async function ProductsPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const productList = await db.query.products.findMany({
        where: eq(products.businessId, session.user.businessId),
        orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Products</h1>
                <ProductFormDialog>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Product
                    </Button>
                </ProductFormDialog>
            </div>

            <div className="rounded-lg border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                    No products found. Add your first product to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            productList.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <div>{product.name}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell>${product.price}</TableCell>
                                    <TableCell>
                                        <AvailabilityToggle id={product.id} isAvailable={product.isAvailable} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ProductFormDialog product={product}>
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </ProductFormDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
