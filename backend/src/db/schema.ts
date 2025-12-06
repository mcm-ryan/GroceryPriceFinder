import { pgTable, serial, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    brand: varchar('brand', { length: 100 }),
    size: varchar('size', { length: 50 }),
    unit: varchar('unit', { length: 20 }),
    searchTerms: text('search_terms'),
    isCommon: boolean('is_common').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_products_normalized_name').on(table.normalizedName),
    index('idx_products_category').on(table.category),
    index('idx_products_common').on(table.isCommon),
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
