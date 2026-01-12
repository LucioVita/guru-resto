import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

let dbInstance: MySql2Database<typeof schema> | null = null;

async function initDb() {
  if (!dbInstance) {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    dbInstance = drizzle(connection, { schema, mode: "default" });
  }
  return dbInstance;
}

export const db = new Proxy({} as MySql2Database<typeof schema>, {
  get(target, prop) {
    return async (...args: any[]) => {
      const instance = await initDb();
      const value = (instance as any)[prop];
      if (typeof value === 'function') {
        return value.apply(instance, args);
      }
      return value;
    };
  }
});
```

Guardá y subí a GitHub:
```
git add src/db/index.ts
git commit -m "Use proxy for lazy db connection"
git push origin main
