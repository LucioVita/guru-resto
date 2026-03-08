'use server';

import { db } from "@/db";
import { cashRegisters, orders, customers } from "@/db/schema";
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
    const existingResult = await db.select()
        .from(cashRegisters)
        .where(
            and(
                eq(cashRegisters.businessId, session.user.businessId),
                eq(cashRegisters.status, "open")
            )
        )
        .limit(1);

    if (existingResult.length > 0) throw new Error("There is already an open cash register");

    const now = new Date();
    console.log(`[Caja] Abriendo caja para business ${session.user.businessId} con monto ${initialAmount} a las ${now.toISOString()}`);

    await db.insert(cashRegisters).values({
        businessId: session.user.businessId,
        openedById: session.user.id,
        initialAmount,
        status: "open",
        openingTime: now,
    });

    revalidatePath("/dashboard/cash-register");
}

async function getCajaStartTime(businessId: string, openingTimeParam: Date | string | null | undefined) {
    if (!openingTimeParam) return new Date();
    const openingTime = new Date(openingTimeParam);

    const previousCajaResult = await db.select()
        .from(cashRegisters)
        .where(
            and(
                eq(cashRegisters.businessId, businessId),
                eq(cashRegisters.status, "closed"),
                lt(cashRegisters.closingTime, openingTime)
            )
        )
        .orderBy(desc(cashRegisters.closingTime))
        .limit(1);

    const previousCaja = previousCajaResult[0];

    if (previousCaja && previousCaja.closingTime) {
        return new Date(previousCaja.closingTime);
    }

    // Fallback if no previous caja found for this business
    const today = new Date(openingTime);
    today.setHours(0, 0, 0, 0);
    return today;
}


function generateCSV(orders: any[], items: any[], openingTime: Date, closingTime: Date, initialAmount: string, finalAmount: string): string {
    // 1. DATA PREPARATION
    const validOrdersForRecap = orders.filter(o => o.status !== 'cancelled');
    const totalSales = validOrdersForRecap.reduce((sum, order) => sum + parseFloat(order.total), 0);

    const byPayment: Record<string, number> = { cash: 0, transfer: 0, card: 0 };
    validOrdersForRecap.forEach(o => {
        const method = o.paymentMethod || 'cash';
        byPayment[method] = (byPayment[method] || 0) + parseFloat(o.total);
    });

    const byProduct: Record<string, { qty: number; total: number }> = {};
    items.forEach(i => {
        const order = orders.find(o => o.id === i.orderId);
        if (order && order.status !== 'cancelled') {
            const name = i.name || 'Producto Desconocido';
            if (!byProduct[name]) byProduct[name] = { qty: 0, total: 0 };
            byProduct[name].qty += i.quantity;
            byProduct[name].total += parseFloat(i.price) * i.quantity;
        }
    });

    const reportRows: any[][] = [];

    // Title & Header
    reportRows.push(['REPORTE DE CIERRE DE CAJA - RESUMEN DE VENTAS']);
    reportRows.push(['Fecha Emision', new Date().toLocaleString('es-AR')]);
    reportRows.push(['Periodo de Caja', `${new Date(openingTime).toLocaleString('es-AR')} hasta ${new Date(closingTime).toLocaleString('es-AR')}`]);
    reportRows.push([]);

    // 2. VENTAS POR MÉTODO (Requested by owner)
    reportRows.push(['TOTALE VENDIDO POR MÉTODO DE PAGO']);
    reportRows.push(['Metodo', 'Total']);
    reportRows.push(['Efectivo', Math.round(byPayment['cash'] || 0)]);
    reportRows.push(['Transferencia', Math.round(byPayment['transfer'] || 0)]);
    reportRows.push(['Tarjeta', Math.round(byPayment['card'] || 0)]);
    reportRows.push(['TOTAL VENTAS BRUTAS', Math.round(totalSales)]);
    reportRows.push([]);

    // 3. ARQUEO DE CAJA
    reportRows.push(['ARQUEO DE CAJA (CONTROL DE EFECTIVO)']);
    reportRows.push(['Monto Inicial', Math.round(parseFloat(initialAmount))]);
    reportRows.push(['Ventas en Efectivo (+)', Math.round(byPayment['cash'] || 0)]);
    reportRows.push(['Total Esperado en Caja', Math.round(parseFloat(initialAmount) + (byPayment['cash'] || 0))]);
    reportRows.push(['Total Real Declarado', Math.round(parseFloat(finalAmount))]);
    const diff = parseFloat(finalAmount) - (parseFloat(initialAmount) + (byPayment['cash'] || 0));
    reportRows.push(['Diferencia', Math.round(diff)]);
    reportRows.push([]);

    // 4. RANKING DE PRODUCTOS (For Stock calculation)
    reportRows.push(['RANKING DE PRODUCTOS VENDIDOS (PARA STOCK)']);
    reportRows.push(['Producto', 'Cantidad Vendida', 'Recaudacion Estimada']);
    Object.entries(byProduct)
        .sort((a, b) => b[1].qty - a[1].qty) // Ranking by quantity
        .forEach(([name, data]) => {
            reportRows.push([name, data.qty, Math.round(data.total)]);
        });
    reportRows.push([]);

    // 5. DETALLE SIMPLIFICADO DE PEDIDOS
    reportRows.push(['DETALLE DE PEDIDOS']);
    reportRows.push(['ID', 'Cliente', 'Monto', 'Metodo', 'Estado']);
    validOrdersForRecap.forEach(o => {
        reportRows.push([
            o.id.slice(-8),
            o.customer?.name || 'Mostrador',
            Math.round(parseFloat(o.total)),
            o.paymentMethod === 'cash' ? 'Efectivo' : o.paymentMethod === 'transfer' ? 'Transferencia' : 'Tarjeta',
            o.status === 'delivered' ? 'Entregado' : o.status === 'ready' ? 'Listo' : 'Pendiente'
        ]);
    });

    return reportRows
        .map(row => row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

export async function closeCajaAction(data: { actualAmount: string; notes?: string }) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const openCajaResult = await db.select()
        .from(cashRegisters)
        .where(
            and(
                eq(cashRegisters.businessId, session.user.businessId),
                eq(cashRegisters.status, "open")
            )
        )
        .limit(1);

    const openCaja = openCajaResult[0];

    if (!openCaja) throw new Error("No open cash register found");

    const startTime = await getCajaStartTime(session.user.businessId, openCaja.openingTime);

    // Get all orders since opening
    const dailyOrdersResult = await db.select({
        order: orders,
        customer: customers
    })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(
            and(
                eq(orders.businessId, session.user.businessId),
                gte(orders.createdAt, startTime)
            )
        );

    const dailyOrders = dailyOrdersResult.map(r => ({
        ...r.order,
        customer: r.customer
    }));

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

    revalidatePath("/dashboard/cash-register");
    redirect(`/dashboard/cash-register/download?cajaId=${openCaja.id}`);
}

export async function getOpenCaja() {
    try {
        const session = await auth();
        if (!session || !session.user.businessId) return null;

        const result = await db.select()
            .from(cashRegisters)
            .where(
                and(
                    eq(cashRegisters.businessId, session.user.businessId),
                    eq(cashRegisters.status, "open")
                )
            )
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error("Error in getOpenCaja:", error);
        return null;
    }
}

export async function getCajaHistory() {
    try {
        const session = await auth();
        if (!session || !session.user.businessId) return [];

        return await db.select()
            .from(cashRegisters)
            .where(eq(cashRegisters.businessId, session.user.businessId))
            .orderBy(desc(cashRegisters.openingTime))
            .limit(20);
    } catch (error) {
        console.error("Error in getCajaHistory:", error);
        return [];
    }
}

export async function downloadCajaReportAction(cajaId: string) {
    redirect(`/dashboard/cash-register/download?cajaId=${cajaId}`);
}

export async function getCSVReportAction(cajaId: string) {
    const session = await auth();
    if (!session || !session.user.businessId) throw new Error("Unauthorized");

    const cajaResult = await db.select()
        .from(cashRegisters)
        .where(
            and(
                eq(cashRegisters.id, cajaId),
                eq(cashRegisters.businessId, session.user.businessId)
            )
        )
        .limit(1);

    const caja = cajaResult[0];

    if (!caja) throw new Error("Caja session not found");

    const startTime = await getCajaStartTime(session.user.businessId, caja.openingTime);
    const endTime = caja.closingTime || new Date();

    // Fetch accurate orders for that period
    const filteredOrdersResult = await db.select({
        order: orders,
        customer: customers
    })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(
            and(
                eq(orders.businessId, session.user.businessId),
                gte(orders.createdAt, startTime),
                lt(orders.createdAt, endTime)
            )
        );

    const filteredOrders = filteredOrdersResult.map(r => ({
        ...r.order,
        customer: r.customer
    }));

    let sessionItems: any[] = [];
    if (filteredOrders.length > 0) {
        sessionItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, filteredOrders.map(o => o.id)));
    }

    const csvContent = generateCSV(
        filteredOrders,
        sessionItems,
        caja.openingTime,
        endTime,
        caja.initialAmount,
        caja.finalAmountActual || "0"
    );

    return {
        content: Buffer.from(csvContent, 'utf-8').toString('base64'),
        filename: `reporte_caja_${new Date(caja.openingTime).toISOString().split('T')[0]}.csv`
    };
}

export async function getCashRegisterOrders() {
    const session = await auth();
    if (!session || !session.user.businessId) return [];

    const openCajaResult = await db.select()
        .from(cashRegisters)
        .where(
            and(
                eq(cashRegisters.businessId, session.user.businessId),
                eq(cashRegisters.status, "open")
            )
        )
        .limit(1);

    const openCaja = openCajaResult[0];

    if (!openCaja) return [];

    const startTime = await getCajaStartTime(session.user.businessId, openCaja.openingTime);

    const ordersResult = await db.select({
        order: orders,
        customer: customers
    })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(
            and(
                eq(orders.businessId, session.user.businessId),
                gte(orders.createdAt, startTime)
            )
        );

    return ordersResult.map(r => ({
        ...r.order,
        customer: r.customer
    }));
}

