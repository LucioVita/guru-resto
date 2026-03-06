import { db } from "./src/db";
import { viandasDiarias } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
    try {
        const business = await db.query.businesses.findFirst();
        if(!business) { console.log("No business"); return; }
        
        console.log("Checking menus for Viernes and Business:", business.id);
        const allMenus = await db.select().from(viandasDiarias).where(
            eq(viandasDiarias.businessId, business.id)
        );
        console.log("All menus in DB for this business:", JSON.stringify(allMenus, null, 2));

        const todayMenus = await db.select().from(viandasDiarias).where(
            and(
                eq(viandasDiarias.businessId, business.id),
                eq(viandasDiarias.diaSemana, 'viernes'),
                eq(viandasDiarias.isAvailable, true)
            )
        );
        console.log("Available menus for Friday:", JSON.stringify(todayMenus, null, 2));

    } catch(e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
main();
