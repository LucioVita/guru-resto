import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // 1. Authentication
        const apiKeyHeader = req.headers.get("x-api-key");
        if (!apiKeyHeader) {
            return NextResponse.json({ error: "Unauthorized: Missing x-api-key" }, { status: 401 });
        }

        const validKey = await db.query.apiKeys.findFirst({
            where: and(eq(apiKeys.key, apiKeyHeader), eq(apiKeys.isActive, true)),
        });

        if (!validKey) {
            return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 401 });
        }

        const businessId = validKey.businessId;

        // 2. Search Logic
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get("phone");

        if (!phone) {
            return NextResponse.json({ error: "Missing 'phone' query parameter" }, { status: 400 });
        }

        const customer = await db.query.customers.findFirst({
            where: and(
                eq(customers.businessId, businessId),
                eq(customers.phone, phone)
            )
        });

        if (!customer) {
            // Return 404 if not found, easier for n8n to handle "False" path
            return NextResponse.json({ message: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json(customer);

    } catch (error) {
        console.error("Search Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
