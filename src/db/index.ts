import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Connection pool estable
const databaseUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database";

let pool;

try {
    // Parseamos la URL manualmente para tener control total de los parámetros y decodificar caracteres
    const url = new URL(databaseUrl);
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    console.log(`[DB] Configurando conexión a: ${url.hostname}`);

    const poolConfig: mysql.PoolOptions = {
        host: url.hostname,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1), // Eliminar el slash inicial
        port: parseInt(url.port) || 3306,
        // SSL solo si no es localhost. 
        // Para Hostinger externo suele requerirse rejectUnauthorized: false o certificados.
        // Para Hostinger interno (desde misma red/Easypanel) a veces no es necesario SSL, pero mal no hace si es opcional.
        ssl: isLocal ? undefined : { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
    };

    pool = mysql.createPool(poolConfig);
} catch (error) {
    console.error("[DB] Error crítico al configurar la conexión:", error);
    // Fallback mínimo para evitar crash inmediato en import, aunque fallará al consultar
    pool = mysql.createPool({ uri: databaseUrl });
}

export const db = drizzle(pool, { schema, mode: "default" });
