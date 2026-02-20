import { z } from 'zod';
import { insertWordSchema, insertProgressSchema, words, attemptLogs, studentProgress } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

// API CONTRACT
export const api = {
  words: {
    list: {
      method: 'GET' as const,
      path: '/api/words' as const,
      responses: {
        200: z.array(z.custom<typeof words.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/words/:id' as const,
      responses: {
        200: z.custom<typeof words.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/words' as const,
      input: insertWordSchema,
      responses: {
        201: z.custom<typeof words.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/words/:id' as const,
      input: insertWordSchema.partial(),
      responses: {
        200: z.custom<typeof words.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/words/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  
  student: {
    // Get words currently assigned/due for review for the authenticated student
    getReviewQueue: {
      method: 'GET' as const,
      path: '/api/student/queue' as const,
      responses: {
        200: z.array(z.custom<{ word: typeof words.$inferSelect; progress: typeof studentProgress.$inferSelect | null }>()),
        401: errorSchemas.unauthorized,
      },
    },
    // Record an attempt at answering a word (Spaced Retrieval Learning algorithm)
    recordAttempt: {
      method: 'POST' as const,
      path: '/api/student/attempt' as const,
      input: z.object({
        wordId: z.coerce.number(),
        questionType: z.string(),
        isCorrect: z.boolean(),
        confidence: z.coerce.number().min(0).max(5),
        responseTimeSec: z.coerce.number().optional()
      }),
      responses: {
        200: z.custom<typeof studentProgress.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    // View their own progress
    myProgress: {
      method: 'GET' as const,
      path: '/api/student/progress' as const,
      responses: {
        200: z.array(z.custom<{ word: typeof words.$inferSelect; progress: typeof studentProgress.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      }
    }
  },
  
  teacher: {
    // Diagnostic dashboard overview
    getDashboard: {
      method: 'GET' as const,
      path: '/api/teacher/dashboard' as const,
      responses: {
        200: z.custom<{
          systemStats: {
            totalWords: number;
            totalAttempts: number;
            masteredCount: number;
            learningCount: number;
          };
          gatekeepers: { word: string; accuracy: number }[];
          leaderboard: { email: string; accuracy: number; rank: number }[];
        }>(),
        401: errorSchemas.unauthorized,
      }
    },
    // Get all students and their stats
    getStudentStats: {
      method: 'GET' as const,
      path: '/api/teacher/students' as const,
      responses: {
        200: z.array(z.custom<{
          userId: string;
          email: string | null;
          firstName: string | null;
          lastName: string | null;
          masteredCount: number;
          learningCount: number;
          totalAttempts: number;
          accuracy: number;
        }>()),
        401: errorSchemas.unauthorized,
      }
    },
    // AI Question Generation
    generateQuestions: {
      method: 'POST' as const,
      path: '/api/teacher/generate-questions' as const,
      input: z.object({
        wordIds: z.array(z.number()),
      }),
      responses: {
        200: z.array(z.custom<any>()),
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type WordInput = z.infer<typeof api.words.create.input>;
export type WordUpdateInput = z.infer<typeof api.words.update.input>;
export type RecordAttemptInput = z.infer<typeof api.student.recordAttempt.input>;
