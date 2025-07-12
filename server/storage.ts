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
import { eq, desc, asc, sql, and, or, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
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
  getVote(userId: string, questionId?: number, answerId?: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, voteType: "up" | "down"): Promise<Vote>;
  deleteVote(id: number): Promise<void>;

  // Notification operations
  getNotifications(userId: string, limit?: number): Promise<NotificationWithQuestion[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
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

    let query = db
      .select({
        id: questions.id,
        title: questions.title,
        description: questions.description,
        authorId: questions.authorId,
        tags: questions.tags,
        votes: questions.votes,
        viewCount: questions.viewCount,
        acceptedAnswerId: questions.acceptedAnswerId,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        answerCount: sql<number>`(
          SELECT COUNT(*) FROM ${answers} 
          WHERE ${answers.questionId} = ${questions.id}
        )`.as('answerCount'),
      })
      .from(questions)
      .leftJoin(users, eq(questions.authorId, users.id));

    // Apply search filter
    if (search) {
      query = query.where(
        or(
          ilike(questions.title, `%${search}%`),
          ilike(questions.description, `%${search}%`)
        )
      );
    }

    // Apply tag filter
    if (tags && tags.length > 0) {
      query = query.where(sql`${questions.tags} && ${tags}`);
    }

    // Apply specific filters
    if (filter === "unanswered") {
      query = query.where(
        sql`(SELECT COUNT(*) FROM ${answers} WHERE ${answers.questionId} = ${questions.id}) = 0`
      );
    }

    // Apply ordering
    if (filter === "newest") {
      query = query.orderBy(desc(questions.createdAt));
    } else {
      query = query.orderBy(desc(questions.createdAt));
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const results = await query;

    return results.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      authorId: row.authorId,
      tags: row.tags,
      votes: row.votes,
      viewCount: row.viewCount,
      acceptedAnswerId: row.acceptedAnswerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author!,
      answers: [],
      _count: {
        answers: row.answerCount,
      },
    }));
  }

  async getQuestion(id: number): Promise<QuestionWithAuthor | undefined> {
    const [question] = await db
      .select({
        id: questions.id,
        title: questions.title,
        description: questions.description,
        authorId: questions.authorId,
        tags: questions.tags,
        votes: questions.votes,
        viewCount: questions.viewCount,
        acceptedAnswerId: questions.acceptedAnswerId,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(questions)
      .leftJoin(users, eq(questions.authorId, users.id))
      .where(eq(questions.id, id));

    if (!question) return undefined;

    const questionAnswers = await this.getAnswersByQuestionId(id);

    return {
      ...question,
      author: question.author!,
      answers: questionAnswers,
      _count: {
        answers: questionAnswers.length,
      },
    };
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
      .set({ viewCount: sql`${questions.viewCount} + 1` })
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
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(answers)
      .leftJoin(users, eq(answers.authorId, users.id))
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.isAccepted), desc(answers.votes), asc(answers.createdAt));

    return results.map((row) => ({
      ...row,
      author: row.author!,
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
    await db.transaction(async (tx) => {
      // Mark all answers as not accepted
      await tx
        .update(answers)
        .set({ isAccepted: false })
        .where(eq(answers.questionId, questionId));

      // Mark the specific answer as accepted
      await tx
        .update(answers)
        .set({ isAccepted: true })
        .where(eq(answers.id, answerId));

      // Update the question's accepted answer
      await tx
        .update(questions)
        .set({ acceptedAnswerId: answerId })
        .where(eq(questions.id, questionId));
    });
  }

  // Vote operations
  async getVote(userId: string, questionId?: number, answerId?: number): Promise<Vote | undefined> {
    const conditions = [eq(votes.userId, userId)];
    
    if (questionId) {
      conditions.push(eq(votes.questionId, questionId));
    }
    
    if (answerId) {
      conditions.push(eq(votes.answerId, answerId));
    }

    const [vote] = await db
      .select()
      .from(votes)
      .where(and(...conditions));

    return vote;
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db
      .insert(votes)
      .values(vote)
      .returning();

    // Update vote count
    await this.updateVoteCount(vote.questionId, vote.answerId, vote.voteType);

    return newVote;
  }

  async updateVote(id: number, voteType: "up" | "down"): Promise<Vote> {
    const [updatedVote] = await db
      .update(votes)
      .set({ voteType })
      .where(eq(votes.id, id))
      .returning();

    // Update vote count
    await this.updateVoteCount(updatedVote.questionId, updatedVote.answerId, voteType);

    return updatedVote;
  }

  async deleteVote(id: number): Promise<void> {
    await db.delete(votes).where(eq(votes.id, id));
  }

  private async updateVoteCount(questionId: number | null, answerId: number | null, voteType: "up" | "down"): Promise<void> {
    if (questionId) {
      const voteCount = await db
        .select({
          upVotes: sql<number>`COUNT(CASE WHEN ${votes.voteType} = 'up' THEN 1 END)`,
          downVotes: sql<number>`COUNT(CASE WHEN ${votes.voteType} = 'down' THEN 1 END)`,
        })
        .from(votes)
        .where(eq(votes.questionId, questionId));

      const netVotes = Number(voteCount[0].upVotes) - Number(voteCount[0].downVotes);

      await db
        .update(questions)
        .set({ votes: netVotes })
        .where(eq(questions.id, questionId));
    }

    if (answerId) {
      const voteCount = await db
        .select({
          upVotes: sql<number>`COUNT(CASE WHEN ${votes.voteType} = 'up' THEN 1 END)`,
          downVotes: sql<number>`COUNT(CASE WHEN ${votes.voteType} = 'down' THEN 1 END)`,
        })
        .from(votes)
        .where(eq(votes.answerId, answerId));

      const netVotes = Number(voteCount[0].upVotes) - Number(voteCount[0].downVotes);

      await db
        .update(answers)
        .set({ votes: netVotes })
        .where(eq(answers.id, answerId));
    }
  }

  // Notification operations
  async getNotifications(userId: string, limit = 20): Promise<NotificationWithQuestion[]> {
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
        question: {
          id: questions.id,
          title: questions.title,
          description: questions.description,
          authorId: questions.authorId,
          tags: questions.tags,
          votes: questions.votes,
          viewCount: questions.viewCount,
          acceptedAnswerId: questions.acceptedAnswerId,
          createdAt: questions.createdAt,
          updatedAt: questions.updatedAt,
        },
        answer: {
          id: answers.id,
          content: answers.content,
          questionId: answers.questionId,
          authorId: answers.authorId,
          votes: answers.votes,
          isAccepted: answers.isAccepted,
          createdAt: answers.createdAt,
          updatedAt: answers.updatedAt,
        },
      })
      .from(notifications)
      .leftJoin(questions, eq(notifications.questionId, questions.id))
      .leftJoin(answers, eq(notifications.answerId, answers.id))
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
      isRead: row.isRead,
      createdAt: row.createdAt,
      question: row.question || undefined,
      answer: row.answer || undefined,
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

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return Number(result.count);
  }
}

export const storage = new DatabaseStorage();
