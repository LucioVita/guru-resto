
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config();

async function main() {
    // Dynamic import to ensure env vars are loaded
    const { db } = await import("../src/db");
    const { apiKeys, businesses } = await import("../src/db/schema");

    console.log("Checking API Keys...");

    try {
        const allKeys = await db.select().from(apiKeys);

        if (allKeys.length === 0) {
            console.log("No API Keys found in the database.");
        } else {
            console.log(`Found ${allKeys.length} API Keys:`);
            console.log("--------------------------------------------------");
            for (const k of allKeys) {
                // Find business for this key
                // Note: db.query is a helper on the drizzle instance
                // We can query business table directly
                const business = await db.query.businesses.findFirst({
                    where: eq(businesses.id, k.businessId)
                });

                console.log(`Key Value: ${k.key}`);
                console.log(`Name:      ${k.name || 'Unnamed'}`);
                console.log(`Active:    ${k.isActive ? '✅ Yes' : '❌ No'}`);
                console.log(`Business:  ${business?.name} (ID: ${k.businessId})`);
                console.log("--------------------------------------------------");
            }
        }
    } catch (error) {
        console.error("Error querying database:", error);
    }

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
