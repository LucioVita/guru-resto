
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
        // This allows for multiple keys, active/inactive status, etc.
        const apiKeyRecord = await db.query.apiKeys.findFirst({
            where: and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)),
        });

        if (apiKeyRecord) {
            return apiKeyRecord.businessId;
        }

        // 2. Check businesses table (simple key from settings)
        // This is necessary because the Dashboard Settings UI currently updates this field directly.
        const businessRecord = await db.query.businesses.findFirst({
            where: eq(businesses.apiKey, key),
        });

        if (businessRecord) {
            return businessRecord.id;
        }
    } catch (error) {
        console.error("Error verifying API Key:", error);
        return null; // Fail safe
    }

    return null;
}
