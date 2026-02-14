import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Test simple de DB
        const result = await db.execute(sql`SELECT 1 as connected`);
        const userCount = await db.select({ count: sql`count(*)` }).from(users);

        return NextResponse.json({
            status: "ok",
            database: "connected",
            usersInDb: userCount[0],
            env: {
                hasAuthSecret: !!process.env.AUTH_SECRET,
                authUrl: process.env.AUTH_URL,
                nodeEnv: process.env.NODE_ENV
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
