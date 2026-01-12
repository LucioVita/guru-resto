import { auth } from "@/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import OrderForm from "@/components/orders/order-form";

export default async function NewOrderPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const productList = await db.query.products.findMany({
        where: eq(products.businessId, session.user.businessId),
        orderBy: (products, { asc }) => [asc(products.name)],
    });

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Place New Order</h1>
            <OrderForm products={productList} />
        </div>
    );
}
