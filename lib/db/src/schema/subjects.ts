import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  timeMode: text("time_mode").notNull().default("duration"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  durationMinutes: integer("duration_minutes"),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  distributeTime: boolean("distribute_time").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  allocatedMinutes: integer("allocated_minutes"),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const postponedLessonsTable = pgTable("postponed_lessons", {
  id: serial("id").primaryKey(),
  subjectName: text("subject_name").notNull(),
  lessonName: text("lesson_name").notNull(),
  originalDate: text("original_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subjectRelations = relations(subjectsTable, ({ many }) => ({
  lessons: many(lessonsTable),
}));

export const lessonRelations = relations(lessonsTable, ({ one }) => ({
  subject: one(subjectsTable, {
    fields: [lessonsTable.subjectId],
    references: [subjectsTable.id],
  }),
}));

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true });
export const insertPostponedSchema = createInsertSchema(postponedLessonsTable).omit({ id: true, createdAt: true });

export type Subject = typeof subjectsTable.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type PostponedLesson = typeof postponedLessonsTable.$inferSelect;
