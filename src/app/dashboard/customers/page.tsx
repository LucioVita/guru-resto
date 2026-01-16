import { auth } from "@/auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
// import components
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerDialog } from "@/components/customers/customer-dialog";

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
                <CustomerDialog />
            </div>

            <CustomerTable customers={customerList} />
        </div>
    );
}
