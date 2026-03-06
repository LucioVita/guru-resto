'use server';

import { db } from "@/db";
import { cashRegisters, orders } from "@/db/schema";
import { eq, and, isNull, sum, gte, desc, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { businesses, orderItems, products as productsTable } from "@/db/schema";

export async function openCajaAction(initialAmountRaw: string) {
    const initialAmount = initialAmountRaw || "0";
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    // Check if there is already an open caja
    const existing = await db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, session.user.businessId),
            eq(cashRegisters.status, "open")
        ),
    });

    if (existing) throw new Error("There is already an open cash register");

    await db.insert(cashRegisters).values({
        businessId: session.user.businessId,
        openedById: session.user.id,
        initialAmount,
        status: "open",
        openingTime: new Date(),
    });

    revalidatePath("/dashboard/cash-register");
}

async function getCajaStartTime(businessId: string, openingTimeParam: Date | string | null | undefined) {
    if (!openingTimeParam) return new Date();
    const openingTime = new Date(openingTimeParam);

    const previousCaja = await db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, businessId),
            eq(cashRegisters.status, "closed"),
            lt(cashRegisters.closingTime, openingTime)
        ),
        orderBy: [desc(cashRegisters.closingTime)]
    });

    if (previousCaja && previousCaja.closingTime) {
        return new Date(previousCaja.closingTime);
    }
    
    // Fallback if no previous caja found for this business
    const today = new Date(openingTime);
    today.setHours(0, 0, 0, 0);
    return today;
}


function generateCSV(orders: any[], items: any[], openingTime: Date, closingTime: Date, initialAmount: string, finalAmount: string): string {
    const headers = [
        'Fecha Pedido',
        'ID Pedido',
        'Cliente',
        'Total',
        'Método de Pago',
        'Estado',
        'Factura CAE',
        'Número Factura'
    ];

    const rows = orders.map(order => [
        new Date(order.createdAt).toLocaleString('es-AR'),
        order.id.slice(-8),
        order.customer?.name || 'Sin nombre',
        `${Math.round(parseFloat(order.total))}`,
        order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia',
        order.status === 'delivered' ? 'Entregado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendiente',
        order.afipCae || 'N/A',
        order.afipInvoiceNumber || 'N/A'
    ]);

    // Summaries
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalSales = validOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    // Paymethod Methods Summary
    const byPayment: Record<string, number> = {};
    validOrders.forEach(o => {
        const method = o.paymentMethod || 'other';
        byPayment[method] = (byPayment[method] || 0) + parseFloat(o.total);
    });

    // Product Summary
    const byProduct: Record<string, { qty: number; total: number }> = {};
    items.forEach(i => {
        const name = i.name || 'Producto Desconocido';
        if (!byProduct[name]) byProduct[name] = { qty: 0, total: 0 };
        byProduct[name].qty += i.quantity;
        byProduct[name].total += parseFloat(i.price) * i.quantity;
    });

    rows.push([]);
    rows.push(['RESUMEN DE CAJA', '', '', '', '', '', '', '']);
    rows.push(['Apertura', new Date(openingTime).toLocaleString('es-AR'), '', '', '', '', '', '']);
    rows.push(['Cierre', new Date(closingTime).toLocaleString('es-AR'), '', '', '', '', '', '']);
    rows.push(['Monto Inicial', `$${Math.round(parseFloat(initialAmount))}`, '', '', '', '', '', '']);
    rows.push(['Total Ventas', `$${Math.round(totalSales)}`, '', '', '', '', '', '']);
    rows.push(['Monto Final Esperado', `$${Math.round(parseFloat(initialAmount) + totalSales)}`, '', '', '', '', '', '']);
    rows.push(['Monto Final Real', `$${Math.round(parseFloat(finalAmount))}`, '', '', '', '', '', '']);
    rows.push(['Diferencia', `$${Math.round(parseFloat(finalAmount) - (parseFloat(initialAmount) + totalSales))}`, '', '', '', '', '', '']);

    rows.push([]);
    rows.push(['VENTAS POR MÉTODO DE PAGO', '', '', '', '', '', '', '']);
    Object.entries(byPayment).forEach(([method, total]) => {
        const label = method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : method === 'transfer' ? 'Transferencia' : method;
        rows.push([label, `$${Math.round(total)}`, '', '', '', '', '', '']);
    });

    rows.push([]);
    rows.push(['VENTAS POR PRODUCTO', 'Cantidad', 'Total', '', '', '', '', '']);
    Object.entries(byProduct)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([name, data]) => {
            rows.push([name, data.qty.toString(), `$${Math.round(data.total)}`, '', '', '', '', '']);
        });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
}

export async function closeCajaAction(data: { actualAmount: string; notes?: string }) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const openCaja = await db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, session.user.businessId),
            eq(cashRegisters.status, "open")
        ),
    });

    if (!openCaja) throw new Error("No open cash register found");

    const startTime = await getCajaStartTime(session.user.businessId, openCaja.openingTime);

    // Get all orders since opening
    const dailyOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.businessId, session.user.businessId),
            gte(orders.createdAt, startTime)
        ),
        with: {
            customer: true,
        },
    });

    // Get items for these orders
    let dailyItems: any[] = [];
    if (dailyOrders.length > 0) {
        dailyItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, dailyOrders.map(o => o.id)));
    }

    // Calculate total sales since opening (excluding cancelled)
    const validDailyOrders = dailyOrders.filter(o => o.status !== 'cancelled');
    const totalSales = validDailyOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const finalCalculated = (parseFloat(openCaja.initialAmount) + totalSales).toString();

    const closingTime = new Date();

    await db.update(cashRegisters)
        .set({
            status: "closed",
            closedById: session.user.id,
            closingTime,
            finalAmountCalculated: finalCalculated,
            finalAmountActual: data.actualAmount,
            notes: data.notes,
        })
        .where(eq(cashRegisters.id, openCaja.id));

    // Generate CSV
    const csvContent = generateCSV(
        dailyOrders,
        dailyItems,
        openCaja.openingTime,
        closingTime,
        openCaja.initialAmount,
        data.actualAmount
    );

    const csvBase64 = Buffer.from(csvContent, 'utf-8').toString('base64');
    const fileName = `resumen_caja_${new Date().toISOString().split('T')[0]}.csv`;

    revalidatePath("/dashboard/cash-register");
    redirect(`/dashboard/cash-register/download?data=${encodeURIComponent(csvBase64)}&filename=${fileName}`);
}

export async function getOpenCaja() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    return db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, session.user.businessId),
            eq(cashRegisters.status, "open")
        ),
    });
}

export async function getCajaHistory() {
    const session = await auth();
    if (!session || !session.user.businessId) return [];

    return db.query.cashRegisters.findMany({
        where: eq(cashRegisters.businessId, session.user.businessId),
        orderBy: [desc(cashRegisters.openingTime)],
        limit: 20
    });
}

export async function downloadCajaReportAction(cajaId: string) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");
    // Only business_admin allowed to download history
    if (session.user.role !== 'business_admin' && session.user.role !== 'super_admin') {
        throw new Error("Acces restricted to administrators");
    }

    const caja = await db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.id, cajaId),
            eq(cashRegisters.businessId, session.user.businessId)
        ),
    });

    if (!caja || !caja.closingTime) throw new Error("Caja session not found or not closed");

    const startTime = await getCajaStartTime(session.user.businessId, caja.openingTime);

    // Fetch accurate orders for that period
    const sessionOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.businessId, session.user.businessId),
            gte(orders.createdAt, startTime)
        ),
        with: { customer: true },
    });

    // Filtering precisely by time range if there are multiple sessions same day
    const filteredOrders = sessionOrders.filter(o =>
        o.createdAt &&
        o.createdAt >= startTime &&
        caja.closingTime &&
        o.createdAt <= caja.closingTime
    );

    let sessionItems: any[] = [];
    if (filteredOrders.length > 0) {
        sessionItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, filteredOrders.map(o => o.id)));
    }

    const csvContent = generateCSV(
        filteredOrders,
        sessionItems,
        caja.openingTime,
        caja.closingTime,
        caja.initialAmount,
        caja.finalAmountActual || "0"
    );

    const csvBase64 = Buffer.from(csvContent, 'utf-8').toString('base64');
    const fileName = `reporte_caja_${new Date(caja.openingTime).toISOString().split('T')[0]}.csv`;

    redirect(`/dashboard/cash-register/download?data=${encodeURIComponent(csvBase64)}&filename=${fileName}`);
}

export async function getCashRegisterOrders() {
    const session = await auth();
    if (!session || !session.user.businessId) return [];

    const openCaja = await db.query.cashRegisters.findFirst({
        where: and(
            eq(cashRegisters.businessId, session.user.businessId),
            eq(cashRegisters.status, "open")
        ),
    });

    if (!openCaja) return [];

    const startTime = await getCajaStartTime(session.user.businessId, openCaja.openingTime);

    return db.query.orders.findMany({
        where: and(
            eq(orders.businessId, session.user.businessId),
            gte(orders.createdAt, startTime)
        ),
        with: {
            customer: true,
        },
    });
}

