import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const result = await db.execute(sql`SELECT 1`);

        // Check if DATABASE_URL is set (partial mask for security)
        const dbUrl = process.env.DATABASE_URL;
        const maskedUrl = dbUrl ? `${dbUrl.substring(0, 10)}...` : "NOT_SET";

        return NextResponse.json({
            status: "ok",
            database: "connected",
            environment_db_url: maskedUrl,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("Database connection error:", error);
        return NextResponse.json(
            {
                status: "error",
                message: error.message,
                environment_db_url: process.env.DATABASE_URL ? "SET (but connection failed)" : "NOT_SET",
                details: error.stack,
            },
            { status: 500 }
        );
    }
}
