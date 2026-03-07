import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { findZoneForPoint } from "./geo";

export async function calculateShippingCost(businessId: string, lat: number, lng: number) {
    const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { deliveryZones: true }
    });

    if (!business?.deliveryZones) {
        return 0;
    }

    const zone = findZoneForPoint([lng, lat], business.deliveryZones);

    if (zone) {
        // Buscamos el precio en las propiedades de la zona (geojson.io permite añadir propiedades)
        const price = zone.properties?.price || zone.properties?.cost || 0;
        return parseFloat(price);
    }

    return null; // Indica que está fuera de zona
}
