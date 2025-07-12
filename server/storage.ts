import {
  users,
  questions,
  answers,
  votes,
  notifications,
  type User,
  type UpsertUser,
  type Question,
  type InsertQuestion,
  type Answer,
  type InsertAnswer,
  type Vote,
  type InsertVote,
  type Notification,
  type InsertNotification,
  type QuestionWithAuthor,
  type AnswerWithAuthor,
  type NotificationWithQuestion,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, or, ilike, count, inArray, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Question operations
  getQuestions(options?: {
    search?: string;
    tags?: string[];
    filter?: "newest" | "unanswered";
    limit?: number;
    offset?: number;
  }): Promise<QuestionWithAuthor[]>;
  getQuestion(id: number): Promise<QuestionWithAuthor | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  incrementViewCount(id: number): Promise<void>;

  // Answer operations
  getAnswersByQuestionId(questionId: number): Promise<AnswerWithAuthor[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer>;
  deleteAnswer(id: number): Promise<void>;
  acceptAnswer(questionId: number, answerId: number): Promise<void>;

  // Vote operations
  getVote(userId: number, questionId?: number, answerId?: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, voteType: "up" | "down"): Promise<Vote>;
  deleteVote(id: number): Promise<void>;

  // Notification operations
  getNotifications(userId: number, limit?: number): Promise<NotificationWithQuestion[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    // For compatibility with both Node.js and Python systems,
    // store the password in both fields
    const userDataWithBothPasswords = {
      ...userData,
      passwordHash: userData.password, // Store password in both fields for compatibility
    };
    
    const [user] = await db
      .insert(users)
      .values(userDataWithBothPasswords)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.username,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Question operations
  async getQuestions(options: {
    search?: string;
    tags?: string[];
    filter?: "newest" | "unanswered";
    limit?: number;
    offset?: number;
  } = {}): Promise<QuestionWithAuthor[]> {
    const { search, tags, filter, limit = 20, offset = 0 } = options;

    try {
      // Build where conditions for search and filters
      let whereConditions: any[] = [];

      // Apply search filter
      if (search && search.trim()) {
        whereConditions.push(
          or(
            ilike(questions.title, `%${search.trim()}%`),
            ilike(questions.description, `%${search.trim()}%`)
          )
        );
      }

      // Apply tag filter
      if (tags && tags.length > 0) {
        whereConditions.push(sql`${questions.tags} && ${tags}`);
      }

      // Apply specific filters
      if (filter === "unanswered") {
        whereConditions.push(
          sql`NOT EXISTS (SELECT 1 FROM ${answers} WHERE ${answers.questionId} = ${questions.id})`
        );
      }

      // Combine where conditions
      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Determine order by clause
      let orderBy;
      if (filter === "newest") {
        orderBy = desc(questions.createdAt);
      } else {
        orderBy = desc(questions.createdAt); // default to newest
      }

      // Simple query to avoid Drizzle relational issues
      const questionsData = await db
        .select({
          id: questions.id,
          title: questions.title,
          description: questions.description,
          tags: questions.tags,
          votes: questions.votes,
          views: questions.views,
          authorId: questions.authorId,
          acceptedAnswerId: questions.acceptedAnswerId,
          createdAt: questions.createdAt,
          updatedAt: questions.updatedAt,
          authorName: users.name,
          authorUsername: users.username,
          authorProfileImageUrl: users.profileImageUrl,
        })
        .from(questions)
        .leftJoin(users, eq(questions.authorId, users.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get answers count for each question
      const questionIds = questionsData.map(q => q.id);
      const answerCounts = questionIds.length > 0 ? await db
        .select({
          questionId: answers.questionId,
          count: count(answers.id),
        })
        .from(answers)
        .where(inArray(answers.questionId, questionIds))
        .groupBy(answers.questionId) : [];

      // Transform to expected format
      const result: QuestionWithAuthor[] = questionsData.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        tags: q.tags || [],
        votes: q.votes || 0,
        views: q.views || 0,
        authorId: q.authorId,
        acceptedAnswerId: q.acceptedAnswerId,
        createdAt: q.createdAt!,
        updatedAt: q.updatedAt!,
        author: {
          id: q.authorId,
          name: q.authorName || 'Unknown',
          username: q.authorUsername || 'unknown',
          profileImageUrl: q.authorProfileImageUrl,
          email: null,
          password: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        answers: [],
        _count: {
          answers: answerCounts.find(ac => ac.questionId === q.id)?.count || 0,
        },
      }));

      return result;
    } catch (error) {
      console.error('Error in getQuestions:', error);
      return [];
    }
  }

  async getQuestion(id: number): Promise<QuestionWithAuthor | undefined> {
    try {
      const [question] = await db
        .select({
          id: questions.id,
          title: questions.title,
          description: questions.description,
          authorId: questions.authorId,
          tags: questions.tags,
          votes: questions.votes,
          views: questions.views,
          acceptedAnswerId: questions.acceptedAnswerId,
          createdAt: questions.createdAt,
          updatedAt: questions.updatedAt,
          authorName: users.name,
          authorUsername: users.username,
          authorProfileImageUrl: users.profileImageUrl,
        })
        .from(questions)
        .leftJoin(users, eq(questions.authorId, users.id))
        .where(eq(questions.id, id));

      if (!question) {
        return undefined;
      }

      // Get answers for this question
      const questionAnswers = await db
        .select({
          id: answers.id,
          content: answers.content,
          votes: answers.votes,
          isAccepted: answers.isAccepted,
          createdAt: answers.createdAt,
          updatedAt: answers.updatedAt,
          authorId: answers.authorId,
          questionId: answers.questionId,
          authorName: users.name,
          authorUsername: users.username,
          authorProfileImageUrl: users.profileImageUrl,
        })
        .from(answers)
        .leftJoin(users, eq(answers.authorId, users.id))
        .where(eq(answers.questionId, id))
        .orderBy(desc(answers.createdAt));

      return {
        id: question.id,
        title: question.title,
        description: question.description,
        tags: question.tags || [],
        votes: question.votes || 0,
        views: question.views || 0,
        authorId: question.authorId,
        acceptedAnswerId: question.acceptedAnswerId,
        createdAt: question.createdAt!,
        updatedAt: question.updatedAt!,
        author: {
          id: question.authorId,
          name: question.authorName || 'Unknown',
          username: question.authorUsername || 'unknown',
          profileImageUrl: question.authorProfileImageUrl,
          email: null,
          password: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        answers: questionAnswers.map(a => ({
          id: a.id,
          content: a.content,
          votes: a.votes || 0,
          isAccepted: a.isAccepted || false,
          createdAt: a.createdAt!,
          updatedAt: a.updatedAt!,
          authorId: a.authorId,
          questionId: a.questionId,
          author: {
            id: a.authorId,
            name: a.authorName || 'Unknown',
            username: a.authorUsername || 'unknown',
            profileImageUrl: a.authorProfileImageUrl,
            email: null,
            password: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })),
        _count: {
          answers: questionAnswers.length,
        },
      };
    } catch (error) {
      console.error('Error in getQuestion:', error);
      return undefined;
    }
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set({ ...question, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async incrementViewCount(id: number): Promise<void> {
    await db
      .update(questions)
      .set({ views: sql`${questions.views} + 1` })
      .where(eq(questions.id, id));
  }

  // Answer operations
  async getAnswersByQuestionId(questionId: number): Promise<AnswerWithAuthor[]> {
    const results = await db
      .select({
        id: answers.id,
        content: answers.content,
        questionId: answers.questionId,
        authorId: answers.authorId,
        votes: answers.votes,
        isAccepted: answers.isAccepted,
        createdAt: answers.createdAt,
        updatedAt: answers.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorProfileImageUrl: users.profileImageUrl,
      })
      .from(answers)
      .leftJoin(users, eq(answers.authorId, users.id))
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.isAccepted), desc(answers.votes), asc(answers.createdAt));

    return results.map((row) => ({
      id: row.id,
      content: row.content,
      questionId: row.questionId,
      authorId: row.authorId,
      votes: row.votes || 0,
      isAccepted: row.isAccepted || false,
      createdAt: row.createdAt!,
      updatedAt: row.updatedAt!,
      author: {
        id: row.authorId,
        name: row.authorName || 'Unknown',
        username: row.authorUsername || 'unknown',
        profileImageUrl: row.authorProfileImageUrl,
        email: null,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [newAnswer] = await db
      .insert(answers)
      .values(answer)
      .returning();
    return newAnswer;
  }

  async updateAnswer(id: number, answer: Partial<InsertAnswer>): Promise<Answer> {
    const [updatedAnswer] = await db
      .update(answers)
      .set({ ...answer, updatedAt: new Date() })
      .where(eq(answers.id, id))
      .returning();
    return updatedAnswer;
  }

  async deleteAnswer(id: number): Promise<void> {
    await db.delete(answers).where(eq(answers.id, id));
  }

  async acceptAnswer(questionId: number, answerId: number): Promise<void> {
    // First, mark all answers for this question as not accepted
    await db
      .update(answers)
      .set({ isAccepted: false })
      .where(eq(answers.questionId, questionId));

    // Then mark the specific answer as accepted
    await db
      .update(answers)
      .set({ isAccepted: true })
      .where(eq(answers.id, answerId));

    // Update the question's accepted answer ID
    await db
      .update(questions)
      .set({ acceptedAnswerId: answerId })
      .where(eq(questions.id, questionId));
  }

  // Vote operations
  async getVote(userId: number, questionId?: number, answerId?: number): Promise<Vote | undefined> {
    let conditions = [eq(votes.userId, userId)];

    if (questionId) {
      conditions.push(eq(votes.questionId, questionId));
      conditions.push(isNull(votes.answerId));
    }
    if (answerId) {
      conditions.push(eq(votes.answerId, answerId));
      conditions.push(isNull(votes.questionId));
    }

    const [vote] = await db.select().from(votes).where(and(...conditions));
    return vote;
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db
      .insert(votes)
      .values(vote)
      .returning();
    
    await this.updateVoteCount(vote.questionId, vote.answerId, vote.voteType);
    return newVote;
  }

  async updateVote(id: number, voteType: "up" | "down"): Promise<Vote> {
    const [updatedVote] = await db
      .update(votes)
      .set({ voteType })
      .where(eq(votes.id, id))
      .returning();
    
    await this.updateVoteCount(updatedVote.questionId, updatedVote.answerId, voteType);
    return updatedVote;
  }

  async deleteVote(id: number): Promise<void> {
    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    await db.delete(votes).where(eq(votes.id, id));
    
    if (vote) {
      await this.updateVoteCount(vote.questionId, vote.answerId, vote.voteType === "up" ? "down" : "up");
    }
  }

  private async updateVoteCount(questionId: number | null | undefined, answerId: number | null | undefined, voteType: "up" | "down"): Promise<void> {
    if (questionId) {
      const totalVotes = await db
        .select({ count: count(votes.id) })
        .from(votes)
        .where(and(
          eq(votes.questionId, questionId),
          eq(votes.voteType, "up")
        ));
      
      const downVotes = await db
        .select({ count: count(votes.id) })
        .from(votes)
        .where(and(
          eq(votes.questionId, questionId),
          eq(votes.voteType, "down")
        ));

      const netVotes = (totalVotes[0]?.count || 0) - (downVotes[0]?.count || 0);
      
      await db
        .update(questions)
        .set({ votes: netVotes })
        .where(eq(questions.id, questionId));
    }

    if (answerId) {
      const totalVotes = await db
        .select({ count: count(votes.id) })
        .from(votes)
        .where(and(
          eq(votes.answerId, answerId),
          eq(votes.voteType, "up")
        ));
      
      const downVotes = await db
        .select({ count: count(votes.id) })
        .from(votes)
        .where(and(
          eq(votes.answerId, answerId),
          eq(votes.voteType, "down")
        ));

      const netVotes = (totalVotes[0]?.count || 0) - (downVotes[0]?.count || 0);
      
      await db
        .update(answers)
        .set({ votes: netVotes })
        .where(eq(answers.id, answerId));
    }
  }

  // Notification operations
  async getNotifications(userId: number, limit = 20): Promise<NotificationWithQuestion[]> {
    const results = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        questionId: notifications.questionId,
        answerId: notifications.answerId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        questionTitle: questions.title,
      })
      .from(notifications)
      .leftJoin(questions, eq(notifications.questionId, questions.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return results.map((row) => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      message: row.message,
      questionId: row.questionId,
      answerId: row.answerId,
      isRead: row.isRead || false,
      createdAt: row.createdAt!,
      question: row.questionTitle ? {
        id: row.questionId!,
        title: row.questionTitle,
        description: '',
        tags: [],
        votes: 0,
        views: 0,
        authorId: 0,
        acceptedAnswerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined,
    }));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count(notifications.id) })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();