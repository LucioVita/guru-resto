
import { db } from "@/db";
import { apiKeys, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Verifies the API Key from the request header.
 * Checks both the `api_keys` table (primary/robust) and the `businesses.api_key` column (settings UI compatibility).
 * 
 * @param key The API Key string from the x-api-key header
 * @returns The Business ID if valid, or null if invalid
 */
export async function verifyApiKey(key: string | null | undefined): Promise<string | null> {
    if (!key) return null;

    try {
        // 1. Check dedicated api_keys table
        const apiKeyResult = await db.select()
            .from(apiKeys)
            .where(and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)))
            .limit(1);

        if (apiKeyResult.length > 0) {
            return apiKeyResult[0].businessId;
        }

        // 2. Check businesses table (simple key from settings)
        const businessResult = await db.select({ id: businesses.id })
            .from(businesses)
            .where(eq(businesses.apiKey, key))
            .limit(1);

        if (businessResult.length > 0) {
            return businessResult[0].id;
        }
    } catch (error) {
        console.error("Error verifying API Key:", error);
        return null;
    }

    return null;
}
