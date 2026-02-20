import { db } from "./db";
import {
  words, studentProgress, attemptLogs, users, aiQuestions,
  type Word, type InsertWord, type UpdateWordRequest, type StudentProgress, type RecordAttemptRequest
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Words
  getWords(): Promise<Word[]>;
  getWord(id: number): Promise<Word | undefined>;
  createWord(word: InsertWord): Promise<Word>;
  updateWord(id: number, word: UpdateWordRequest): Promise<Word>;
  deleteWord(id: number): Promise<void>;

  // Student Actions
  getReviewQueue(userId: string): Promise<{word: Word, progress: StudentProgress | null}[]>;
  recordAttempt(userId: string, attempt: RecordAttemptRequest): Promise<StudentProgress>;
  getStudentProgress(userId: string): Promise<{word: Word, progress: StudentProgress}[]>;

  // Teacher Dashboard
  getSystemStats(): Promise<any>;
  getStudentStats(): Promise<any[]>;
  saveAiQuestions(questions: any[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getWords(): Promise<Word[]> {
    return await db.select().from(words);
  }

  async getWord(id: number): Promise<Word | undefined> {
    const [word] = await db.select().from(words).where(eq(words.id, id));
    return word;
  }

  async createWord(word: InsertWord): Promise<Word> {
    const [newWord] = await db.insert(words).values(word).returning();
    return newWord;
  }

  async updateWord(id: number, update: UpdateWordRequest): Promise<Word> {
    const [updated] = await db.update(words).set(update).where(eq(words.id, id)).returning();
    return updated;
  }

  async deleteWord(id: number): Promise<void> {
    await db.delete(words).where(eq(words.id, id));
  }

  async getReviewQueue(userId: string): Promise<{word: Word, progress: StudentProgress | null}[]> {
    // Basic implementation: get all active words, join with student progress
    const allWords = await db.select().from(words).where(eq(words.status, 'Active'));
    const progresses = await db.select().from(studentProgress).where(eq(studentProgress.userId, userId));
    
    return allWords.map(w => {
      const prog = progresses.find(p => p.wordId === w.id) || null;
      return { word: w, progress: prog };
    }).filter(item => {
      // Show words that are new (no progress) or due for review
      if (!item.progress) return true;
      if (!item.progress.nextReviewDate) return true;
      return new Date(item.progress.nextReviewDate) <= new Date();
    });
  }

  async recordAttempt(userId: string, attempt: RecordAttemptRequest): Promise<StudentProgress> {
    // SM-2 logic simplified
    let [prog] = await db.select().from(studentProgress).where(and(eq(studentProgress.userId, userId), eq(studentProgress.wordId, attempt.wordId)));
    
    const quality = attempt.isCorrect ? attempt.confidence : (attempt.confidence >= 4 ? 2 : attempt.confidence === 3 ? 1 : 0);
    
    let ef = prog ? parseFloat(prog.easinessFactor || '2.5') : 2.5;
    let streak = prog ? prog.consecutiveCorrect! : 0;
    
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    ef = Math.max(1.3, Math.min(2.5, ef));
    
    let newStreak = quality >= 3 ? streak + 1 : 0;
    let interval = 1;
    if (quality < 3) interval = 1;
    else if (newStreak === 1) interval = 1;
    else if (newStreak === 2) interval = 6;
    else interval = Math.round((prog && prog.nextReviewDate ? 2 : 1) * ef);

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    const newLevel = Math.min(5, Math.floor(newStreak / 2) + 1);

    // Log the attempt
    await db.insert(attemptLogs).values({
      userId,
      wordId: attempt.wordId,
      attemptDate: new Date(),
      questionType: attempt.questionType,
      isCorrect: attempt.isCorrect,
      confidence: attempt.confidence,
      responseTimeSec: attempt.responseTimeSec || 0,
      termLevelAtAttempt: prog ? prog.level! : 1,
    });

    if (prog) {
      const [updated] = await db.update(studentProgress).set({
        level: newLevel,
        totalAttempts: (prog.totalAttempts || 0) + 1,
        totalCorrect: (prog.totalCorrect || 0) + (attempt.isCorrect ? 1 : 0),
        easinessFactor: ef.toFixed(2),
        consecutiveCorrect: newStreak,
        lastAttemptDate: new Date(),
        nextReviewDate,
      }).where(eq(studentProgress.id, prog.id)).returning();
      return updated;
    } else {
      const [inserted] = await db.insert(studentProgress).values({
        userId,
        wordId: attempt.wordId,
        level: newLevel,
        totalAttempts: 1,
        totalCorrect: attempt.isCorrect ? 1 : 0,
        easinessFactor: ef.toFixed(2),
        consecutiveCorrect: newStreak,
        lastAttemptDate: new Date(),
        nextReviewDate,
      }).returning();
      return inserted;
    }
  }

  async getStudentProgress(userId: string): Promise<{word: Word, progress: StudentProgress}[]> {
    const results = await db.select({
      word: words,
      progress: studentProgress
    }).from(studentProgress).innerJoin(words, eq(studentProgress.wordId, words.id)).where(eq(studentProgress.userId, userId));
    return results;
  }

  async getSystemStats(): Promise<any> {
    const allWords = await db.select().from(words);
    const allProgress = await db.select().from(studentProgress);
    
    let masteredCount = 0;
    let learningCount = 0;
    const levelCounts: Record<number, number> = {1:0, 2:0, 3:0, 4:0, 5:0};

    allProgress.forEach(p => {
      const lvl = p.level || 1;
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
      if (lvl >= 5) masteredCount++;
      else if (lvl > 1) learningCount++;
    });

    return {
      totalWords: allWords.length,
      totalAttempts: allProgress.reduce((sum, p) => sum + (p.totalAttempts || 0), 0),
      masteredCount,
      learningCount,
      levelCounts,
      gatekeepers: []
    };
  }

  async getStudentStats(): Promise<any[]> {
    const allUsers = await db.select().from(users);
    const allProgress = await db.select().from(studentProgress);
    
    return allUsers.map(u => {
      const userProgress = allProgress.filter(p => p.userId === u.id);
      let masteredCount = 0;
      let learningCount = 0;
      let totalAttempts = 0;
      let totalCorrect = 0;
      
      userProgress.forEach(p => {
        if ((p.level || 1) >= 5) masteredCount++;
        else if ((p.level || 1) > 1) learningCount++;
        totalAttempts += (p.totalAttempts || 0);
        totalCorrect += (p.totalCorrect || 0);
      });
      
      return {
        userId: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        masteredCount,
        learningCount,
        totalAttempts,
        accuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
      };
    });
  }

  async saveAiQuestions(questions: any[]): Promise<void> {
    if (questions.length === 0) return;
    for (const q of questions) {
      await db.insert(aiQuestions).values(q);
    }
  }
}

export const storage = new DatabaseStorage();
