import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        const result = await db.execute(sql`SHOW TABLES`);
        console.log("Tables:", JSON.stringify(result[0], null, 2));
        
        try {
            const columns = await db.execute(sql`DESCRIBE cash_registers`);
            console.log("Columns of cash_registers:", JSON.stringify(columns[0], null, 2));
        } catch (e) {
            console.error("cash_registers table might be missing");
        }
    } catch (e) {
        console.error("DB check failed", e);
    }
}

check();
