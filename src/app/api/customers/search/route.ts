import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user.businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const results = await db.select().from(customers).where(
        and(
            eq(customers.businessId, session.user.businessId),
            or(
                ilike(customers.name, `%${query}%`),
                ilike(customers.phone, `%${query}%`)
            )
        )
    ).limit(10);

    return NextResponse.json(results);
}
