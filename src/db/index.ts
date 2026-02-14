import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Connection pool estable
const databaseUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database";

let pool;
try {
    console.log(`[DB] Iniciando pool de conexiones...`);
    pool = mysql.createPool({
        uri: databaseUrl,
        // SSL solo si no es localhost
        ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? undefined : { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
    });
} catch (error) {
    console.error("[DB] Error de configuración inicial:", error);
    // Fallback mínimo para evitar crash
    pool = mysql.createPool(databaseUrl || "mysql://localhost:3306/placeholder");
}

export const db = drizzle(pool, { schema, mode: "default" });
