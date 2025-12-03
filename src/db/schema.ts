import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default("todo"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})
