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
import ProductSearch from "@/components/products/product-search";

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const params = await searchParams;
    const query = params?.query?.toLowerCase() || "";

    const allProducts = await db.query.products.findMany({
        where: eq(products.businessId, session.user.businessId),
        orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    const productList = query
        ? allProducts.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query))
        : allProducts;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold">Productos</h1>
                <div className="flex items-center gap-4">
                    <ProductSearch />
                    <ProductFormDialog>
                        <Button className="gap-2 whitespace-nowrap">
                            <Plus className="h-4 w-4" />
                            Agregar Producto
                        </Button>
                    </ProductFormDialog>
                </div>
            </div>

            <div className="rounded-lg border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-gray-700 font-semibold">Nombre</TableHead>
                            <TableHead className="text-gray-700 font-semibold">Categoría</TableHead>
                            <TableHead className="text-gray-700 font-semibold">Precio</TableHead>
                            <TableHead className="text-gray-700 font-semibold">Estado</TableHead>
                            <TableHead className="text-right text-gray-700 font-semibold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                    {query ? "No se encontraron productos con esa búsqueda." : "No se encontraron productos. Agrega tu primer producto para comenzar."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            productList.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium text-gray-900">
                                        <div>{product.name}</div>
                                        <div className="text-xs text-gray-600 truncate max-w-[200px]">{product.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-900 font-semibold">${Math.round(parseFloat(product.price))}</TableCell>
                                    <TableCell>
                                        <AvailabilityToggle id={product.id} isAvailable={product.isAvailable} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ProductFormDialog product={product}>
                                            <Button variant="ghost" size="sm">Editar</Button>
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
