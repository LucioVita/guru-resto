import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

let connection: any = null;

async function getConnection() {
  if (!connection) {
   connection = await mysql.createConnection(process.env.DATABASE_URL!);
  }
  return connection;
}

export const db = drizzle({ 
  client: { 
    query: async (...args: any[]) => {
      const conn = await getConnection();
      return conn.query(...args);
    }
  } as any,
  schema, 
  mode: "default" 
});
