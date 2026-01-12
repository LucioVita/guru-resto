CREATE TABLE `businesses` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`api_key` varchar(255),
	`webhook_url` varchar(500),
	`webhook_status_url` varchar(500),
	`afip_cuit` varchar(20),
	`afip_token` varchar(500),
	`afip_environment` enum('dev','prod') DEFAULT 'dev',
	`afip_punto_venta` int,
	`afip_certificate` text,
	`afip_private_key` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `businesses_api_key_unique` UNIQUE(`api_key`)
);
--> statement-breakpoint
CREATE TABLE `cash_registers` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`business_id` varchar(36) NOT NULL,
	`opened_by_id` varchar(36) NOT NULL,
	`closed_by_id` varchar(36),
	`opening_time` timestamp NOT NULL DEFAULT (now()),
	`closing_time` timestamp,
	`initial_amount` decimal(10,2) NOT NULL,
	`final_amount_calculated` decimal(10,2),
	`final_amount_actual` decimal(10,2),
	`notes` varchar(500),
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	CONSTRAINT `cash_registers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`business_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`address` varchar(500),
	`notes` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`order_id` varchar(36) NOT NULL,
	`product_id` varchar(36),
	`quantity` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`notes` varchar(500),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`business_id` varchar(36) NOT NULL,
	`customer_id` varchar(36),
	`status` enum('pending','preparation','ready','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`total` decimal(10,2) NOT NULL,
	`payment_method` varchar(50) DEFAULT 'cash',
	`afip_cae` varchar(100),
	`afip_cae_expiration` timestamp,
	`afip_invoice_number` int,
	`afip_invoice_type` int,
	`afip_invoice_punto_venta` int,
	`afip_invoiced_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`business_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(500),
	`price` decimal(10,2) NOT NULL,
	`category` varchar(100) NOT NULL,
	`is_available` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`password_hash` varchar(255) NOT NULL,
	`role` enum('super_admin','business_admin','user') NOT NULL DEFAULT 'user',
	`business_id` varchar(36),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_opened_by_id_users_id_fk` FOREIGN KEY (`opened_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_closed_by_id_users_id_fk` FOREIGN KEY (`closed_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;