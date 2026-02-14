import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Connection pool con manejo de errores para evitar crash en el arranque
let pool;
try {
    let databaseUrl = process.env.DATABASE_URL || "";

    // Si estamos en Hostinger y la URL usa el host externo, intentamos convertirla a localhost
    // para evitar bloqueos de firewall interno.
    if (databaseUrl.includes('hstgr.io') && process.env.NODE_ENV === 'production') {
        console.log('[DB] Detectado Hostinger. Optimizando conexión para uso interno...');
        // Reemplazar el host srvXXX.hstgr.io por 127.0.0.1
        databaseUrl = databaseUrl.replace(/@srv[^:]+:/, '@127.0.0.1:');
    }

    console.log(`[DB] Iniciando pool de conexiones...`);
    pool = mysql.createPool({
        uri: databaseUrl,
        ssl: databaseUrl.includes('127.0.0.1') || databaseUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
    });
} catch (error) {
    console.error("[DB] Error fatal creando el pool:", error);
    pool = mysql.createPool({ uri: "mysql://localhost:3306/placeholder" });
}

export const db = drizzle(pool, { schema, mode: "default" });


