import { mysqlTable, varchar, timestamp, boolean, varchar as uuid, int, decimal, mysqlEnum, text } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

// Enums in MySQL are handled slightly differently in Drizzle, usually as varchar with specific values or using mysqlEnum
export const roleEnum = ["super_admin", "business_admin", "user"] as const;
export const orderStatusEnum = ["pending", "preparation", "ready", "delivered", "cancelled"] as const;

export const businesses = mysqlTable("businesses", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    apiKey: varchar("api_key", { length: 255 }).unique(),
    webhookUrl: varchar("webhook_url", { length: 500 }),
    webhookStatusUrl: varchar("webhook_status_url", { length: 500 }),
    // Business Info
    phone: varchar("phone", { length: 50 }),
    address: varchar("address", { length: 500 }),
    // AFIP Settings
    afipCuit: varchar("afip_cuit", { length: 20 }),
    afipToken: varchar("afip_token", { length: 500 }),
    afipEnvironment: mysqlEnum("afip_environment", ["dev", "prod"]).default("dev"),
    afipPuntoVenta: int("afip_punto_venta"),
    afipCertificate: text("afip_certificate"),
    afipPrivateKey: text("afip_private_key"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const users = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    email: varchar("email", { length: 255 }).unique().notNull(),
    name: varchar("name", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", roleEnum).default("user").notNull(),
    businessId: varchar("business_id", { length: 36 }).references(() => businesses.id),
    createdAt: timestamp("created_at").defaultNow(),
});

export const products = mysqlTable("products", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    businessId: varchar("business_id", { length: 36 }).references(() => businesses.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 500 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const customers = mysqlTable("customers", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    businessId: varchar("business_id", { length: 36 }).references(() => businesses.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    address: varchar("address", { length: 500 }),
    email: varchar("email", { length: 255 }),
    status: varchar("status", { length: 50 }).default("active"), // active, waiting_address, archived
    notes: varchar("notes", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),
});

export const orders = mysqlTable("orders", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    businessId: varchar("business_id", { length: 36 }).references(() => businesses.id).notNull(),
    customerId: varchar("customer_id", { length: 36 }).references(() => customers.id),
    status: mysqlEnum("status", orderStatusEnum).default("pending").notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).default("cash"),
    // AFIP Invoice Info
    afipCae: varchar("afip_cae", { length: 100 }),
    afipCaeExpiration: timestamp("afip_cae_expiration"),
    afipInvoiceNumber: int("afip_invoice_number"),
    afipInvoiceType: int("afip_invoice_type"),
    afipInvoicePuntoVenta: int("afip_invoice_punto_venta"),
    afipInvoicedAt: timestamp("afip_invoiced_at"),
    source: varchar("source", { length: 50 }).default("web"), // web, whatsapp, phone, etc.
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable("order_items", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    orderId: varchar("order_id", { length: 36 }).references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    productId: varchar("product_id", { length: 36 }).references(() => products.id),
    name: varchar("name", { length: 255 }).notNull(), // Snapshot of product name or ad-hoc name
    quantity: int("quantity").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    notes: varchar("notes", { length: 500 }),
});

// Relations
// Old businessRelations removed


export const userRelations = relations(users, ({ one }) => ({
    business: one(businesses, {
        fields: [users.businessId],
        references: [businesses.id],
    }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
    business: one(businesses, {
        fields: [orders.businessId],
        references: [businesses.id],
    }),
    customer: one(customers, {
        fields: [orders.customerId],
        references: [customers.id],
    }),
    items: many(orderItems),
}));

export const cashRegisters = mysqlTable("cash_registers", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    businessId: varchar("business_id", { length: 36 }).references(() => businesses.id).notNull(),
    openedById: varchar("opened_by_id", { length: 36 }).references(() => users.id).notNull(),
    closedById: varchar("closed_by_id", { length: 36 }).references(() => users.id),
    openingTime: timestamp("opening_time").defaultNow().notNull(),
    closingTime: timestamp("closing_time"),
    initialAmount: decimal("initial_amount", { precision: 10, scale: 2 }).notNull(),
    finalAmountCalculated: decimal("final_amount_calculated", { precision: 10, scale: 2 }),
    finalAmountActual: decimal("final_amount_actual", { precision: 10, scale: 2 }),
    notes: varchar("notes", { length: 500 }),
    status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
});

export const cashRegisterRelations = relations(cashRegisters, ({ one }) => ({
    business: one(businesses, {
        fields: [cashRegisters.businessId],
        references: [businesses.id],
    }),
    openedBy: one(users, {
        fields: [cashRegisters.openedById],
        references: [users.id],
    }),
    closedBy: one(users, {
        fields: [cashRegisters.closedById],
        references: [users.id],
    }),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

export const apiKeys = mysqlTable("api_keys", {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    businessId: varchar("business_id", { length: 36 }).references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
    key: varchar("key", { length: 255 }).unique().notNull(), // The actual API Key (hashed ideally, but plain for now based on request simplicity or hashed if specified)
    // Request says "key (hash o string único)". I'll use a unique string for now to match typical API key usage (e.g. sk_live_...) 
    // If strict security is needed, we'd hash it, but let's stick to unique string for lookup speed unless specified.
    name: varchar("name", { length: 100 }), // e.g. "N8N Integration"
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
});

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
    business: one(businesses, {
        fields: [apiKeys.businessId],
        references: [businesses.id],
    }),
}));

// Update business relations to include apiKeys
export const businessRelations = relations(businesses, ({ many }) => ({
    users: many(users),
    products: many(products),
    customers: many(customers),
    orders: many(orders),
    apiKeys: many(apiKeys),
}));
