
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // 1. Authentication
        const apiKeyHeader = req.headers.get("x-api-key");

        if (!apiKeyHeader) {
            return NextResponse.json(
                { error: "Unauthorized: Missing x-api-key header" },
                { status: 401 }
            );
        }

        const validKey = await db.query.apiKeys.findFirst({
            where: and(eq(apiKeys.key, apiKeyHeader), eq(apiKeys.isActive, true)),
        });

        if (!validKey) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or inactive API Key" },
                { status: 401 }
            );
        }

        const businessId = validKey.businessId;

        // 2. Fetch Products
        // Filter by businessId and optionally by availability if needed, but for now let's return all.
        // We can add ?available=true query param later if requested.
        const allProducts = await db.query.products.findMany({
            where: eq(products.businessId, businessId),
            orderBy: (products, { asc }) => [asc(products.category), asc(products.name)],
        });

        return NextResponse.json(allProducts);

    } catch (error) {
        console.error("API GET Products Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        },
    });
}
