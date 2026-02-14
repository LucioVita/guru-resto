import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Connection pool con manejo de errores para evitar crash en el arranque
let pool;
try {
    const databaseUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database";
    console.log(`[DB] Iniciando pool de conexiones...`);
    pool = mysql.createPool({
        uri: databaseUrl,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
} catch (error) {
    console.error("[DB] Error fatal creando el pool:", error);
    // Fallback para evitar que la app crashee al importar este módulo
    pool = mysql.createPool({ uri: "mysql://localhost:3306/placeholder" });
}

export const db = drizzle(pool, { schema, mode: "default" });


