import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

let connection: mysql.Connection | null = null;

async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection(process.env.DATABASE_URL!);
  }
  return connection;
}

export async function getDb() {
  const conn = await getConnection();
  return drizzle(conn, { schema, mode: "default" });
}
