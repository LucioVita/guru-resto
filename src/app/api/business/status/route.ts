import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user.businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const businessResult = await db.select({
            isOpen: businesses.isOpen,
        })
        .from(businesses)
        .where(eq(businesses.id, session.user.businessId))
        .limit(1);

        const business = businessResult[0];

        return NextResponse.json({ isOpen: business?.isOpen ?? true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    console.log("[STATUS_API] User trying to change status:", session?.user?.email, "Role:", session?.user?.role);
    
    if (!session || !session.user.businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { isOpen } = body;

        if (typeof isOpen !== "boolean") {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        console.log("[STATUS_API] Updating business", session.user.businessId, "to", isOpen);

        await db.update(businesses)
            .set({ isOpen })
            .where(eq(businesses.id, session.user.businessId));

        return NextResponse.json({ success: true, isOpen });
    } catch (error: any) {
        console.error("[STATUS_API] Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

