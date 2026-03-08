import { isPointInPolygon, findZoneForPoint } from "../src/lib/geo";

const samplePolygon: [number, number][] = [
    [-65.47, -33.68],
    [-65.45, -33.68],
    [-65.45, -33.70],
    [-65.47, -33.70],
    [-65.47, -33.68]
];

const pointInside: [number, number] = [-65.46, -33.69];
const pointOutside: [number, number] = [-65.48, -33.69];

console.log("Testing Point in Polygon:");
console.log("Point Inside:", isPointInPolygon(pointInside, samplePolygon)); // Should be true
console.log("Point Outside:", isPointInPolygon(pointOutside, samplePolygon)); // Should be false

const sampleGeoJSON = JSON.stringify({
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "price": 500 },
            "geometry": {
                "type": "Polygon",
                "coordinates": [samplePolygon]
            }
        }
    ]
});

console.log("\nTesting findZoneForPoint:");
const zone = findZoneForPoint(pointInside, sampleGeoJSON);
console.log("Zone found price:", zone?.properties?.price); // Should be 500
