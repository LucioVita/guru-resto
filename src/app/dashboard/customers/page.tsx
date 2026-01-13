import { auth } from "@/auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus, Search, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
    const session = await auth();
    if (!session || !session.user.businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <p className="text-gray-500">No se encontró información del negocio.</p>
            </div>
        );
    }

    const customerList = await db.query.customers.findMany({
        where: eq(customers.businessId, session.user.businessId),
        orderBy: [desc(customers.createdAt)],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Clientes</h1>
                    <p className="text-gray-500 text-sm">Gestiona la base de datos de tus clientes</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    Nuevo Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerList.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed">
                        <Plus className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No hay clientes registrados aún.</p>
                    </div>
                ) : (
                    customerList.map((customer) => (
                        <Card key={customer.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold">{customer.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {customer.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="h-4 w-4" />
                                        {customer.phone}
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        {customer.address}
                                    </div>
                                )}
                                {customer.notes && (
                                    <p className="text-xs text-gray-400 italic mt-2">
                                        "{customer.notes}"
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
