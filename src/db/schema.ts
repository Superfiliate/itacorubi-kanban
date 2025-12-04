import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

// Boards - identified by UUID
export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(), // UUID
  title: text("title").notNull().default("New board"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const boardsRelations = relations(boards, ({ many }) => ({
  columns: many(columns),
  tasks: many(tasks),
  contributors: many(contributors),
}))

// Columns - belong to a board, orderable
export const columns = sqliteTable("columns", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  isCollapsed: integer("is_collapsed", { mode: "boolean" }).default(false),
})

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  tasks: many(tasks),
}))

// Tasks - belong to a board and column
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  columnId: text("column_id").notNull().references(() => columns.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  position: integer("position").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  board: one(boards, {
    fields: [tasks.boardId],
    references: [boards.id],
  }),
  column: one(columns, {
    fields: [tasks.columnId],
    references: [columns.id],
  }),
  assignees: many(taskAssignees),
}))

// Predefined color palette for contributors
export const CONTRIBUTOR_COLORS = [
  "rose",
  "pink",
  "fuchsia",
  "purple",
  "violet",
  "indigo",
  "blue",
  "sky",
  "cyan",
  "teal",
  "emerald",
  "green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "red",
] as const

export type ContributorColor = typeof CONTRIBUTOR_COLORS[number]

// Contributors - belong to a board
export const contributors = sqliteTable("contributors", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().$type<ContributorColor>(),
})

export const contributorsRelations = relations(contributors, ({ one, many }) => ({
  board: one(boards, {
    fields: [contributors.boardId],
    references: [boards.id],
  }),
  taskAssignees: many(taskAssignees),
}))

// Task assignees - many-to-many
export const taskAssignees = sqliteTable("task_assignees", {
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  contributorId: text("contributor_id").notNull().references(() => contributors.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.taskId, t.contributorId] })])

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  contributor: one(contributors, {
    fields: [taskAssignees.contributorId],
    references: [contributors.id],
  }),
}))

// Type exports
export type Board = typeof boards.$inferSelect
export type NewBoard = typeof boards.$inferInsert
export type Column = typeof columns.$inferSelect
export type NewColumn = typeof columns.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Contributor = typeof contributors.$inferSelect
export type NewContributor = typeof contributors.$inferInsert
export type TaskAssignee = typeof taskAssignees.$inferSelect
