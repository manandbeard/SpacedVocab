import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

import { GoogleGenAI } from "@google/genai";
import { batchProcess } from "./replit_integrations/batch";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication first
  await setupAuth(app);
  registerAuthRoutes(app);

  // AI Question Generation Endpoint
  app.post(api.teacher.generateQuestions.path, isAuthenticated, async (req, res) => {
    try {
      const { wordIds } = api.teacher.generateQuestions.input.parse(req.body);
      const selectedWords = await Promise.all(wordIds.map(id => storage.getWord(id)));
      const validWords = selectedWords.filter(Boolean);

      const generatedQuestions = await batchProcess(
        validWords,
        async (word: any) => {
          const prompt = `Generate a high-quality multiple choice question for the vocabulary word "${word.term}" (Definition: ${word.definition}). 
          Include 4 options, the correct answer, and a short explanation. 
          Return ONLY a JSON object like: {"questionText": "...", "options": ["...", "..."], "correctAnswer": "...", "explanation": "..."}`;
          
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });

          const text = response.response.text();
          // Extract JSON from potential markdown
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return { ...parsed, wordId: word.id };
          }
          throw new Error("Failed to parse AI response");
        },
        { concurrency: 2 }
      );

      // Save to DB (optional but good for persistence)
      // await storage.saveAiQuestions(generatedQuestions);

      res.json(generatedQuestions);
    } catch (err) {
      console.error("AI Generation Error:", err);
      res.status(500).json({ message: "Failed to generate questions with AI" });
    }
  });

  // ... existing routes ...
  app.get(api.words.list.path, async (req, res) => {
    const allWords = await storage.getWords();
    res.json(allWords);
  });

  app.get(api.words.get.path, async (req, res) => {
    const word = await storage.getWord(Number(req.params.id));
    if (!word) return res.status(404).json({ message: "Word not found" });
    res.json(word);
  });

  app.post(api.words.create.path, async (req, res) => {
    try {
      const input = api.words.create.input.parse(req.body);
      const newWord = await storage.createWord(input);
      res.status(201).json(newWord);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.words.update.path, async (req, res) => {
    try {
      const input = api.words.update.input.parse(req.body);
      const updated = await storage.updateWord(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.words.delete.path, async (req, res) => {
    await storage.deleteWord(Number(req.params.id));
    res.status(204).end();
  });

  // Student Endpoints (Protected)
  app.get(api.student.getReviewQueue.path, isAuthenticated, async (req: any, res) => {
    const queue = await storage.getReviewQueue(req.user.claims.sub);
    res.json(queue);
  });

  app.post(api.student.recordAttempt.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.student.recordAttempt.input.parse(req.body);
      const result = await storage.recordAttempt(req.user.claims.sub, input);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.student.myProgress.path, isAuthenticated, async (req: any, res) => {
    const progress = await storage.getStudentProgress(req.user.claims.sub);
    res.json(progress);
  });

  // Teacher Endpoints (Protected)
  app.get(api.teacher.getDashboard.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getSystemStats();
    res.json({
      systemStats: {
        totalWords: stats.totalWords,
        totalAttempts: stats.totalAttempts,
        masteredCount: stats.masteredCount,
        learningCount: stats.learningCount,
      },
      gatekeepers: [],
      leaderboard: []
    });
  });

  app.get(api.teacher.getStudentStats.path, isAuthenticated, async (req, res) => {
    const studentStats = await storage.getStudentStats();
    res.json(studentStats);
  });

  // Seed data on startup
  seedDatabase().catch(console.error);

  return httpServer;
}

export async function seedDatabase() {
  const existingWords = await storage.getWords();
  if (existingWords.length === 0) {
    await storage.createWord({ term: "Diligent", definition: "Having or showing care and conscientiousness in one's work or duties.", partOfSpeech: "Adjective", exampleSentence: "She was a diligent student, always completing her assignments on time." });
    await storage.createWord({ term: "Ephemeral", definition: "Lasting for a very short time.", partOfSpeech: "Adjective", exampleSentence: "Fashions are ephemeral." });
    await storage.createWord({ term: "Benevolent", definition: "Well meaning and kindly.", partOfSpeech: "Adjective", exampleSentence: "A benevolent smile." });
    await storage.createWord({ term: "Tenacious", definition: "Tending to keep a firm hold of something; clinging or adhering closely.", partOfSpeech: "Adjective", exampleSentence: "A tenacious grip." });
    await storage.createWord({ term: "Lucid", definition: "Expressed clearly; easy to understand.", partOfSpeech: "Adjective", exampleSentence: "A lucid account." });
  }
}
