
/**
 * Verfica si un punto está dentro de un polígono (Ray-casting algorithm)
 * punto: [lng, lat]
 * poligono: [[lng, lat], [lng, lat], ...]
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][]) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Calcula un área estimada para comparar tamaños de polígonos (Shoelace formula)
 */
function getPolygonArea(polygon: [number, number][]) {
    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        area += (polygon[j][0] + polygon[i][0]) * (polygon[j][1] - polygon[i][1]);
    }
    return Math.abs(area / 2);
}

/**
 * Parsea un GeoJSON de zonas y devuelve la zona MÁS PEQUEÑA que contiene el punto.
 * Esto permite manejar polígonos anidados correctamente.
 */
export function findZoneForPoint(point: [number, number], geojsonStr: string) {
    try {
        const geojson = JSON.parse(geojsonStr);
        if (geojson.type !== 'FeatureCollection') return null;

        let bestFeature: any = null;
        let smallestArea = Infinity;

        for (const feature of geojson.features) {
            let isInside = false;
            let currentArea = 0;

            if (feature.geometry.type === 'Polygon') {
                if (isPointInPolygon(point, feature.geometry.coordinates[0])) {
                    isInside = true;
                    currentArea = getPolygonArea(feature.geometry.coordinates[0]);
                }
            } else if (feature.geometry.type === 'MultiPolygon') {
                for (const polygon of feature.geometry.coordinates) {
                    if (isPointInPolygon(point, polygon[0])) {
                        isInside = true;
                        currentArea = getPolygonArea(polygon[0]);
                        break;
                    }
                }
            }

            if (isInside && currentArea < smallestArea) {
                smallestArea = currentArea;
                bestFeature = feature;
            }
        }
        return bestFeature;
    } catch (e) {
        console.error("Error parsing GeoJSON zones:", e);
    }
    return null;
}
