import { auth } from "@/auth";
import { db } from "@/db";
import { viandasDiarias } from "@/db/schema";
import { eq } from "drizzle-orm";
import DailyMenuEditor from "@/components/daily-menu/daily-menu-editor";
import type { DiaSemana } from "@/actions/daily-menu-actions";

export const dynamic = 'force-dynamic';

const DAYS: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export default async function DailyMenuPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const allMenus = await db.select().from(viandasDiarias).where(
        eq(viandasDiarias.businessId, session.user.businessId)
    );

    // Group by day
    const menusByDay: Record<DiaSemana, typeof allMenus> = {
        lunes: [],
        martes: [],
        miercoles: [],
        jueves: [],
        viernes: [],
        sabado: [],
        domingo: [],
    };

    for (const menu of allMenus) {
        const day = menu.diaSemana as DiaSemana;
        if (menusByDay[day]) {
            menusByDay[day].push(menu);
        }
    }

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-20 -mt-6 -mx-6 px-6 pt-6 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Menú Diario</h1>
                    <p className="text-gray-500 text-sm">Configura hasta 3 opciones por día de la semana</p>
                </div>
            </div>

            <DailyMenuEditor initialMenus={menusByDay} />
        </div>
    );
}
