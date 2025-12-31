import type { Request, Response, NextFunction } from "express";
import { generateToken } from "../lib/jwt";
import { prisma } from "@titan/db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Password validation helper
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }
  if (password.length > 100) {
    return { valid: false, error: "Password is too long" };
  }
  // Check for at least one number and one letter
  if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain both letters and numbers" };
  }
  return { valid: true };
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split("@")[0],
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * OAuth Callback - For GitHub OAuth and other OAuth providers
 * This endpoint creates or finds users without requiring passwords
 */
export const oauthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, githubId, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find or create user (OAuth flow doesn't require password)
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new OAuth user
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          githubId: githubId || null,
          avatar: avatar || null,
          // passwordHash is null for OAuth users
        },
      });
    } else if (githubId && !user.githubId) {
      // Update existing user with GitHub ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { githubId, avatar },
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
