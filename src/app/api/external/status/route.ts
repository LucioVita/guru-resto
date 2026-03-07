import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const apiKey = req.headers.get("x-api-key");
        const businessId = await verifyApiKey(apiKey);

        if (!businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const business = await db.query.businesses.findFirst({
            where: eq(businesses.id, businessId),
            columns: {
                name: true,
                isOpen: true,
            }
        });

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        return NextResponse.json({
            businessName: business.name,
            isOpen: business.isOpen,
            status: business.isOpen ? "open" : "closed"
        });
    } catch (error) {
        console.error("[API_EXTERNAL_STATUS]", error);
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

