import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database";
const pool = mysql.createPool({
    uri: databaseUrl,
    ssl: { rejectUnauthorized: false },
});



export const db = drizzle(pool, { schema, mode: "default" });


