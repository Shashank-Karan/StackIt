import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerUser, loginUser } from "./auth";
import { insertQuestionSchema, insertAnswerSchema, insertVoteSchema, registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { generateAIResponse } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await registerUser(userData);
      
      // Set session
      req.session!.user = user;
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: error.message || "Failed to register user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await loginUser(credentials);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session!.user = user;
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Error logging in user:", error);
      res.status(400).json({ message: error.message || "Failed to login" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session!.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', async (req, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Question routes
  app.get('/api/questions', async (req, res) => {
    try {
      const { search, tags, filter, limit, offset } = req.query;
      
      const questions = await storage.getQuestions({
        search: search as string,
        tags: tags ? (tags as string).split(',') : undefined,
        filter: filter as "newest" | "unanswered",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const question = await storage.getQuestion(id);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Increment view count
      await storage.incrementViewCount(id);

      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.post('/api/questions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Creating question for user:', user.id);
      console.log('Request body:', req.body);
      
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        authorId: user.id,
      });

      console.log('Parsed question data:', questionData);
      
      const question = await storage.createQuestion(questionData);
      console.log('Created question:', question);
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      if (error instanceof z.ZodError) {
        console.log('Validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const existingQuestion = await storage.getQuestion(id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }

      if (existingQuestion.authorId !== user.id) {
        return res.status(403).json({ message: "Not authorized to edit this question" });
      }

      const questionData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, questionData);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const existingQuestion = await storage.getQuestion(id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }

      if (existingQuestion.authorId !== user.id) {
        return res.status(403).json({ message: "Not authorized to delete this question" });
      }

      await storage.deleteQuestion(id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Answer routes
  app.get('/api/questions/:id/answers', async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const answers = await storage.getAnswersByQuestionId(questionId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  app.post('/api/questions/:id/answers', isAuthenticated, async (req: any, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const answerData = insertAnswerSchema.parse({
        ...req.body,
        questionId,
        authorId: user.id,
      });

      const answer = await storage.createAnswer(answerData);

      // Create notification for question author
      const question = await storage.getQuestion(questionId);
      if (question && question.authorId !== user.id) {
        await storage.createNotification({
          userId: question.authorId,
          type: "question_answered",
          title: "New Answer",
          message: `Someone answered your question: ${question.title}`,
          questionId,
          answerId: answer.id,
        });
      }

      res.json(answer);
    } catch (error) {
      console.error("Error creating answer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  app.put('/api/answers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const existingAnswer = await storage.getAnswersByQuestionId(0);
      const answer = existingAnswer.find(a => a.id === id);
      
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }

      if (answer.authorId !== user.id) {
        return res.status(403).json({ message: "Not authorized to edit this answer" });
      }

      const answerData = insertAnswerSchema.partial().parse(req.body);
      const updatedAnswer = await storage.updateAnswer(id, answerData);
      res.json(updatedAnswer);
    } catch (error) {
      console.error("Error updating answer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update answer" });
    }
  });

  app.post('/api/questions/:questionId/answers/:answerId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const answerId = parseInt(req.params.answerId);
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      if (question.authorId !== user.id) {
        return res.status(403).json({ message: "Only the question author can accept answers" });
      }

      await storage.acceptAnswer(questionId, answerId);

      // Create notification for answer author
      const answer = question.answers.find(a => a.id === answerId);
      if (answer && answer.authorId !== user.id) {
        await storage.createNotification({
          userId: answer.authorId,
          type: "answer_accepted",
          title: "Answer Accepted",
          message: `Your answer was accepted for: ${question.title}`,
          questionId,
          answerId,
        });
      }

      res.json({ message: "Answer accepted successfully" });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  // Vote routes
  app.post('/api/votes', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { questionId, answerId, voteType } = req.body;
      
      console.log('Vote request body:', req.body);
      console.log('Parsed values:', { questionId, answerId, voteType });

      // Check if user already voted
      const existingVote = await storage.getVote(user.id, questionId, answerId);
      
      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // Same vote type, remove the vote
          await storage.deleteVote(existingVote.id);
          return res.json({ message: "Vote removed" });
        } else {
          // Different vote type, update the vote
          const updatedVote = await storage.updateVote(existingVote.id, voteType);
          return res.json(updatedVote);
        }
      }

      // Create new vote
      const voteData = insertVoteSchema.parse({
        userId: user.id,
        questionId: questionId || null,
        answerId: answerId || null,
        voteType,
      });

      const vote = await storage.createVote(voteData);
      res.json(vote);
    } catch (error) {
      console.error("Error creating vote:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { limit } = req.query;
      
      const notifications = await storage.getNotifications(
        user.id,
        limit ? parseInt(limit as string) : undefined
      );

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // AI Chatbot routes
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      if (message.length > 2000) {
        return res.status(400).json({ message: "Message too long. Please keep it under 2000 characters." });
      }

      console.log("Processing AI chat request:", message.substring(0, 100) + "...");
      const aiResponse = await generateAIResponse(message);
      console.log("AI response generated successfully");
      
      res.json({ response: aiResponse });
    } catch (error: any) {
      console.error("Error in AI chat endpoint:", error);
      
      // Send the specific error message from the generateAIResponse function
      const errorMessage = error.message || "Failed to generate AI response";
      res.status(500).json({ message: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
