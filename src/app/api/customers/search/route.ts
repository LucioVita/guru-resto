import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys, customers } from "@/db/schema";
import { eq, and, or, like } from "drizzle-orm";
import { verifyApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
    try {
        // 1. Authentication
        const apiKeyHeader = req.headers.get("x-api-key");
        const businessId = await verifyApiKey(apiKeyHeader);

        if (!businessId) {
            return NextResponse.json({ error: "Unauthorized: Invalid or missing x-api-key" }, { status: 401 });
        }

        // 2. Search Logic
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get("phone");

        if (!phone) {
            return NextResponse.json({ error: "Missing 'phone' query parameter" }, { status: 400 });
        }

        // Enhanced search: Check exact match OR suffix match (last 8 digits) OR Argentina 549->54
        const cleanPhone = phone.replace(/\D/g, "");
        let searchCondition = eq(customers.phone, phone);

        if (cleanPhone.length >= 8) {
            const suffix = cleanPhone.slice(-8);
            const withoutNine = cleanPhone.startsWith("549") ? "54" + cleanPhone.slice(3) : null;

            searchCondition = or(
                eq(customers.phone, phone), // Exact
                like(customers.phone, `%${suffix}`), // Suffix (most robust)
                withoutNine ? eq(customers.phone, withoutNine) : undefined // Specific 549 fix
            )!;
        }

        const customer = await db.query.customers.findFirst({
            where: and(
                eq(customers.businessId, businessId),
                searchCondition
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
