'use server';

import { db } from "@/db";
import { cashRegisters, orders } from "@/db/schema";
import { eq, and, isNull, sum, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function openCajaAction(initialAmount: string) {
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
    });

    revalidatePath("/dashboard/cash-register");
}

function generateCSV(orders: any[], openingTime: Date, closingTime: Date, initialAmount: string, finalAmount: string): string {
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
        `$${Math.round(parseFloat(order.total))}`,
        order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia',
        order.status === 'delivered' ? 'Entregado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendiente',
        order.afipCae || 'N/A',
        order.afipInvoiceNumber || 'N/A'
    ]);

    // Add summary rows
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    rows.push([]);
    rows.push(['RESUMEN DE CAJA', '', '', '', '', '', '', '']);
    rows.push(['Apertura', new Date(openingTime).toLocaleString('es-AR'), '', '', '', '', '', '']);
    rows.push(['Cierre', new Date(closingTime).toLocaleString('es-AR'), '', '', '', '', '', '']);
    rows.push(['Monto Inicial', `$${Math.round(parseFloat(initialAmount))}`, '', '', '', '', '', '']);
    rows.push(['Total Ventas', `$${Math.round(totalSales)}`, '', '', '', '', '', '']);
    rows.push(['Monto Final Esperado', `$${Math.round(parseFloat(initialAmount) + totalSales)}`, '', '', '', '', '', '']);
    rows.push(['Monto Final Real', `$${Math.round(parseFloat(finalAmount))}`, '', '', '', '', '', '']);
    rows.push(['Diferencia', `$${Math.round(parseFloat(finalAmount) - (parseFloat(initialAmount) + totalSales))}`, '', '', '', '', '', '']);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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

    // Get all orders since opening
    const dailyOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.businessId, session.user.businessId),
            gte(orders.createdAt, openCaja.openingTime)
        ),
        with: {
            customer: true,
        },
    });

    // Calculate total sales since opening
    const totalSales = dailyOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
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
        openCaja.openingTime,
        closingTime,
        openCaja.initialAmount,
        data.actualAmount
    );

    // Create a data URL for download
    const csvBase64 = Buffer.from(csvContent, 'utf-8').toString('base64');
    const downloadUrl = `data:text/csv;base64,${csvBase64}`;

    // Store CSV in a temporary location or trigger download
    // For now, we'll redirect with the CSV data
    const fileName = `ventas_${new Date().toISOString().split('T')[0]}_${openCaja.id.slice(-8)}.csv`;

    revalidatePath("/dashboard/cash-register");

    // Redirect to a download page with CSV data
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
