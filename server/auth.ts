import bcrypt from 'bcrypt';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import type { RegisterData, LoginData, User } from '@shared/schema';

const SALT_ROUNDS = 12;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function registerUser(userData: RegisterData): Promise<User> {
  // Check if username already exists
  const existingUser = await storage.getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Check if email already exists (if provided)
  if (userData.email) {
    const existingEmailUser = await storage.getUserByEmail(userData.email);
    if (existingEmailUser) {
      throw new Error('Email already exists');
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const user = await storage.createUser({
    username: userData.username,
    password: hashedPassword,
    name: userData.name,
    email: userData.email,
  });

  return user;
}

export async function loginUser(credentials: LoginData): Promise<User | null> {
  const user = await storage.getUserByUsername(credentials.username);
  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(credentials.password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return user;
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Extend session interface to include user
declare module 'express-session' {
  interface SessionData {
    user: User;
  }
}