import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const demo_widget_user_snapshots = pgTable('demo_widget_user_snapshots', {
  userId: varchar('user_id', { length: 36 }).primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  roleKey: text('role_key').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
