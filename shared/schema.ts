import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export all models from auth and chat modules!
export * from "./models/auth";
export * from "./models/chat";
import { users } from "./models/auth";
import { conversations } from "./models/chat";

// === TABLE DEFINITIONS ===

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  partOfSpeech: text("part_of_speech"),
  exampleSentence: text("example_sentence"),
  phase: integer("phase").default(1),
  status: text("status").default('Active'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentProgress = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  wordId: integer("word_id").references(() => words.id).notNull(),
  level: integer("level").default(1),
  totalAttempts: integer("total_attempts").default(0),
  totalCorrect: integer("total_correct").default(0),
  easinessFactor: text("easiness_factor").default('2.5'),
  consecutiveCorrect: integer("consecutive_correct").default(0),
  lastAttemptDate: timestamp("last_attempt_date"),
  firstLearnedDate: timestamp("first_learned_date").defaultNow(),
  nextReviewDate: timestamp("next_review_date"),
});

export const attemptLogs = pgTable("attempt_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  wordId: integer("word_id").references(() => words.id).notNull(),
  attemptDate: timestamp("attempt_date").defaultNow(),
  questionType: text("question_type").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  confidence: integer("confidence").notNull(),
  responseTimeSec: integer("response_time_sec").default(0),
  termLevelAtAttempt: integer("term_level_at_attempt").notNull(),
});

// AI Questions Table
export const aiQuestions = pgTable("ai_questions", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").references(() => words.id).notNull(),
  questionText: text("question_text").notNull(),
  options: text("options").array(), // For multiple choice
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(studentProgress),
  attempts: many(attemptLogs),
}));

export const wordsRelations = relations(words, ({ many }) => ({
  progress: many(studentProgress),
  attempts: many(attemptLogs),
  aiQuestions: many(aiQuestions),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  user: one(users, { fields: [studentProgress.userId], references: [users.id] }),
  word: one(words, { fields: [studentProgress.wordId], references: [words.id] }),
}));

export const attemptLogsRelations = relations(attemptLogs, ({ one }) => ({
  user: one(users, { fields: [attemptLogs.userId], references: [users.id] }),
  word: one(words, { fields: [attemptLogs.wordId], references: [words.id] }),
}));

export const aiQuestionsRelations = relations(aiQuestions, ({ one }) => ({
  word: one(words, { fields: [aiQuestions.wordId], references: [words.id] }),
}));

// === BASE SCHEMAS ===
export const insertWordSchema = createInsertSchema(words).omit({ id: true, createdAt: true });
export const insertProgressSchema = createInsertSchema(studentProgress).omit({ id: true });
export const insertAttemptLogSchema = createInsertSchema(attemptLogs).omit({ id: true, attemptDate: true });
export const insertAiQuestionSchema = createInsertSchema(aiQuestions).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Word = typeof words.$inferSelect;
export type InsertWord = z.infer<typeof insertWordSchema>;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type AttemptLog = typeof attemptLogs.$inferSelect;
export type AiQuestion = typeof aiQuestions.$inferSelect;

export type CreateWordRequest = InsertWord;
export type UpdateWordRequest = Partial<InsertWord>;

export interface RecordAttemptRequest {
  wordId: number;
  questionType: string;
  isCorrect: boolean;
  confidence: number;
  responseTimeSec?: number;
}
