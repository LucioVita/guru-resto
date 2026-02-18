import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKey } from "@/lib/api-auth";
import { db } from "@/db";
import { apiKeys, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const customerSchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication (x-api-key)
        const apiKeyHeader = req.headers.get("x-api-key");
        const businessId = await verifyApiKey(apiKeyHeader);

        if (!businessId) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing element x-api-key" },
                { status: 401 }
            );
        }

        // 2. Validate Body
        const body = await req.json();
        const validation = customerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation Error", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { name, phone, address, email } = validation.data;

        // 3. Check for Duplicates (Phone + Business)
        const existingCustomer = await db.query.customers.findFirst({
            where: and(
                eq(customers.businessId, businessId),
                eq(customers.phone, phone)
            )
        });

        if (existingCustomer) {
            return NextResponse.json(
                {
                    error: "Conflict: Customer already exists with this phone number",
                    customerId: existingCustomer.id,
                    // Optionally return the customer object if needed
                    customer: {
                        name: existingCustomer.name,
                        address: existingCustomer.address
                    }
                },
                { status: 409 }
            );
        }

        // 4. Determine Status
        // "Si creas un cliente sin proporcionarle un address (domicilio), el cliente se guardará automáticamente con el estado 'esperando_direccion'"
        let status = "active";
        if (!address || address.trim() === "") {
            status = "waiting_address";
        }

        // 5. Create Customer
        const newId = crypto.randomUUID();
        await db.insert(customers).values({
            id: newId,
            businessId: businessId,
            name,
            phone,
            address: address || null,
            email: email || null,
            status: status,
        });

        return NextResponse.json({
            success: true,
            message: "Customer created successfully",
            customerId: newId,
            status: status
        }, { status: 201 });

    } catch (error) {
        console.error("API Customer Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

const updateCustomerSchema = z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    status: z.enum(["active", "waiting_address", "archived"]).optional(),
    notes: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
    try {
        const apiKeyHeader = req.headers.get("x-api-key");
        const businessId = await verifyApiKey(apiKeyHeader);

        if (!businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = updateCustomerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation Error", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { id, ...updateData } = validation.data;

        // Verify customer belongs to the business
        const existing = await db.query.customers.findFirst({
            where: and(
                eq(customers.id, id),
                eq(customers.businessId, businessId)
            )
        });

        if (!existing) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Update
        await db.update(customers)
            .set(updateData)
            .where(eq(customers.id, id));

        return NextResponse.json({
            success: true,
            message: "Customer updated successfully"
        });

    } catch (error) {
        console.error("API Customer PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        },
    });
}
