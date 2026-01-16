import 'dotenv/config';
import { db } from './index';
import { sql } from "drizzle-orm";

async function fixDatabase() {
    console.log("🚑 Iniciando reparación de base de datos manual (Safety Mode)...");

    try {
        // 1. Agregar tabla api_keys si no existe
        console.log("⏳ Verificando tabla api_keys...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS api_keys (
                id varchar(36) PRIMARY KEY,
                business_id varchar(36) NOT NULL,
                \`key\` varchar(255) NOT NULL UNIQUE,
                name varchar(100),
                is_active boolean DEFAULT true NOT NULL,
                created_at timestamp DEFAULT (now()),
                last_used_at timestamp,
                CONSTRAINT api_keys_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
            );
        `);
        console.log("✅ Tabla api_keys verificada.");

        // 2. Agregar columnas a customers
        try {
            console.log("⏳ Agregando columna 'email' a customers...");
            await db.execute(sql`ALTER TABLE customers ADD COLUMN email varchar(255);`);
            console.log("✅ Columna email agregada.");
        } catch (e: any) {
            if (e.message && e.message.includes("Duplicate column")) {
                console.log("ℹ️ Columna email ya existía.");
            } else {
                console.log("⚠️ Error agregando email (puede que ya exista):", e.message);
            }
        }

        try {
            console.log("⏳ Agregando columna 'status' a customers...");
            await db.execute(sql`ALTER TABLE customers ADD COLUMN status varchar(50) DEFAULT 'active';`);
            console.log("✅ Columna status agregada.");
        } catch (e: any) {
            if (e.message && e.message.includes("Duplicate column")) {
                console.log("ℹ️ Columna status ya existía.");
            } else {
                console.log("⚠️ Error agregando status (puede que ya exista):", e.message);
            }
        }

        // 3. Agregar columnas a orders
        try {
            console.log("⏳ Agregando columna 'source' a orders...");
            await db.execute(sql`ALTER TABLE orders ADD COLUMN source varchar(50) DEFAULT 'web';`);
            console.log("✅ Columna source agregada.");
        } catch (e: any) {
            if (e.message && e.message.includes("Duplicate column")) {
                console.log("ℹ️ Columna source ya existía.");
            } else {
                console.log("⚠️ Error agregando source (puede que ya exista):", e.message);
            }
        }

        // 4. Agregar columna name a order_items
        try {
            console.log("⏳ Agregando columna 'name' a order_items...");
            // Usamos DEFAULT '' para evitar errores con filas existentes que no tienen nombre
            await db.execute(sql`ALTER TABLE order_items ADD COLUMN name varchar(255) NOT NULL DEFAULT 'Item sin nombre';`);
            console.log("✅ Columna name agregada a order_items.");
        } catch (e: any) {
            if (e.message && e.message.includes("Duplicate column")) {
                console.log("ℹ️ Columna name ya existía.");
            } else {
                console.log("⚠️ Error agregando name (puede que ya exista):", e.message);
            }
        }

        console.log("🚀 Reparación completada con éxito. La base de datos debería ser compatible ahora.");

    } catch (error) {
        console.error("❌ Error fatal inesperado durante la reparación:", error);
    } finally {
        process.exit();
    }
}

fixDatabase();
