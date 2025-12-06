CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"brand" varchar(100),
	"size" varchar(50),
	"unit" varchar(20),
	"search_terms" text,
	"is_common" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_products_normalized_name" ON "products" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_common" ON "products" USING btree ("is_common");