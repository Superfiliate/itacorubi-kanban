import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================
// TABLE DEFINITIONS
// ============================================================

export const TASK_PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// Boards - identified by UUID
export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(), // UUID
  title: text("title").notNull().default("New board"),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Columns - belong to a board, orderable
export const columns = sqliteTable("columns", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  isCollapsed: integer("is_collapsed", { mode: "boolean" }).default(false),
});

// Tasks - belong to a board and column
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "restrict" }),
  columnId: text("column_id")
    .notNull()
    .references(() => columns.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  priority: text("priority").notNull().default("none").$type<TaskPriority>(),
  position: integer("position").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

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
] as const;

export type ContributorColor = (typeof CONTRIBUTOR_COLORS)[number];

// Contributors - belong to a board
export const contributors = sqliteTable("contributors", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  color: text("color").notNull().$type<ContributorColor>(),
});

// Task assignees - many-to-many
// Note: Using "restrict" to force intentional deletion of assignments before removing tasks/contributors
export const taskAssignees = sqliteTable(
  "task_assignees",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    contributorId: text("contributor_id")
      .notNull()
      .references(() => contributors.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.contributorId] })],
);

// Task stakeholders - many-to-many (reuses contributors)
// Note: Using "restrict" to force intentional deletion of stakeholder relationships before removing tasks/contributors
export const taskStakeholders = sqliteTable(
  "task_stakeholders",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    contributorId: text("contributor_id")
      .notNull()
      .references(() => contributors.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.contributorId] })],
);

// Tags - belong to a board
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  color: text("color").notNull().$type<ContributorColor>(),
});

// Task tags - many-to-many
// Note: Using "restrict" to force intentional deletion of tag assignments before removing tasks/tags
export const taskTags = sqliteTable(
  "task_tags",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "restrict" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })],
);

// Comments - belong to a task and have an author (contributor) and optional stakeholder
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(), // UUID
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "restrict" }),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "restrict" }),
  authorId: text("author_id")
    .notNull()
    .references(() => contributors.id, { onDelete: "restrict" }),
  stakeholderId: text("stakeholder_id").references(() => contributors.id, { onDelete: "restrict" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Uploaded files - belong to a board, track storage usage
// Note: commentId has no FK constraint since files are uploaded before comments exist
// Cleanup is handled by explicit logic in deleteComment action
export const uploadedFiles = sqliteTable("uploaded_files", {
  id: text("id").primaryKey(), // UUID
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "restrict" }),
  commentId: text("comment_id").notNull(), // No FK - files uploaded before comment exists
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(), // Size in bytes for quota calculations
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================
// RELATIONS
// ============================================================

export const boardsRelations = relations(boards, ({ many }) => ({
  columns: many(columns),
  tasks: many(tasks),
  contributors: many(contributors),
  tags: many(tags),
  comments: many(comments),
  uploadedFiles: many(uploadedFiles),
}));

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  tasks: many(tasks),
}));

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
  stakeholders: many(taskStakeholders),
  tags: many(taskTags),
  comments: many(comments),
}));

export const contributorsRelations = relations(contributors, ({ one, many }) => ({
  board: one(boards, {
    fields: [contributors.boardId],
    references: [boards.id],
  }),
  taskAssignees: many(taskAssignees),
  taskStakeholders: many(taskStakeholders),
  comments: many(comments),
  commentsAsStakeholder: many(comments),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  contributor: one(contributors, {
    fields: [taskAssignees.contributorId],
    references: [contributors.id],
  }),
}));

export const taskStakeholdersRelations = relations(taskStakeholders, ({ one }) => ({
  task: one(tasks, {
    fields: [taskStakeholders.taskId],
    references: [tasks.id],
  }),
  contributor: one(contributors, {
    fields: [taskStakeholders.contributorId],
    references: [contributors.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  board: one(boards, {
    fields: [tags.boardId],
    references: [boards.id],
  }),
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  board: one(boards, {
    fields: [comments.boardId],
    references: [boards.id],
  }),
  author: one(contributors, {
    fields: [comments.authorId],
    references: [contributors.id],
  }),
  stakeholder: one(contributors, {
    fields: [comments.stakeholderId],
    references: [contributors.id],
  }),
  uploadedFiles: many(uploadedFiles),
}));

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  board: one(boards, {
    fields: [uploadedFiles.boardId],
    references: [boards.id],
  }),
  comment: one(comments, {
    fields: [uploadedFiles.commentId],
    references: [comments.id],
  }),
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Contributor = typeof contributors.$inferSelect;
export type NewContributor = typeof contributors.$inferInsert;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type TaskStakeholder = typeof taskStakeholders.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type TaskTag = typeof taskTags.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type NewUploadedFile = typeof uploadedFiles.$inferInsert;
