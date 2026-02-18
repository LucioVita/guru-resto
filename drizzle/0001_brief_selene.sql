CREATE TABLE `api_keys` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`business_id` varchar(36) NOT NULL,
	`key` varchar(255) NOT NULL,
	`name` varchar(100),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`last_used_at` timestamp,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `businesses` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `businesses` ADD `address` varchar(500);--> statement-breakpoint
ALTER TABLE `customers` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `customers` ADD `status` varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `order_items` ADD `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `source` varchar(50) DEFAULT 'web';--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_business_id_businesses_id_fk` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE cascade ON UPDATE no action;