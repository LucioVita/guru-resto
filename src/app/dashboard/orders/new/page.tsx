import { auth } from "@/auth";
import { db } from "@/db";
import { products, viandasDiarias } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DiaSemana } from "@/actions/daily-menu-actions";
import OrderForm from "@/components/orders/order-form";

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const daysTranslation: Record<string, DiaSemana> = {
        'Monday': 'lunes',
        'Tuesday': 'martes',
        'Wednesday': 'miercoles',
        'Thursday': 'jueves',
        'Friday': 'viernes',
        'Saturday': 'sabado',
        'Sunday': 'domingo'
    };
    const currentDayEnglish = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    const currentDay = daysTranslation[currentDayEnglish];

    const productList = await db.query.products.findMany({
        where: eq(products.businessId, session.user.businessId),
        orderBy: (products, { asc }) => [asc(products.name)],
    });

    const todayMenus = await db.select().from(viandasDiarias).where(
        and(
            eq(viandasDiarias.businessId, session.user.businessId),
            eq(viandasDiarias.diaSemana, currentDay),
            eq(viandasDiarias.isAvailable, true)
        )
    );

    const formattedDailyMenus = todayMenus.map(m => ({
        id: `daily-${m.id}`,
        name: `[MENÚ] ${m.name}`,
        price: m.price.toString(),
        category: "Menú Diario",
        isAvailable: true
    }));

    const combinedProducts = [...formattedDailyMenus, ...productList];

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-black tracking-tighter mb-8 italic text-primary">Tomar Pedido</h1>
            <OrderForm products={combinedProducts} />
        </div>
    );
}
