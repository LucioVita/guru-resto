import { db } from "./src/db";
import { cashRegisters, businesses, users, orders } from "./src/db/schema";
import { eq, desc, and, lt, gte } from "drizzle-orm";

async function main() {
    try {
        const business = await db.query.businesses.findFirst();
        if(!business) { console.log("No business"); return; }
        const user = await db.query.users.findFirst({ where: eq(users.businessId, business.id) });
        
        console.log("Checking getCajaStartTime...");
        const openingTime = new Date();
        const previousCaja = await db.query.cashRegisters.findFirst({
            where: and(
                eq(cashRegisters.businessId, business.id),
                eq(cashRegisters.status, "closed"),
                lt(cashRegisters.closingTime, openingTime)
            ),
            orderBy: [desc(cashRegisters.closingTime)]
        });
        console.log("Previous caja:", previousCaja ? previousCaja.id : "null");

        console.log("Success");
    } catch(e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
main();
