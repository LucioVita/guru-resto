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
        const business = await db.query.businesses.findFirst({
            where: eq(businesses.id, session.user.businessId),
            columns: {
                isOpen: true,
            }
        });

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

    // Solo admin puede cambiar el estado
    if (session.user.role !== "business_admin" && session.user.role !== "super_admin") {
        console.warn("[STATUS_API] Access denied for role:", session.user.role);
        return NextResponse.json({ error: "Forbidden: Only admins can change status" }, { status: 403 });
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

