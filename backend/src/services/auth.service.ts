import bcrypt from 'bcrypt';
import prisma from '../db/prisma';
import { generateTokens } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { AuthTokens } from '../types';

export class AuthService {
  async register(email: string, username: string, displayName: string, password: string): Promise<{ user: any; tokens: AuthTokens }> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictError('Email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const tokens = generateTokens(email, email);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        password: hashedPassword,
        refreshToken: tokens.refreshToken,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { user, tokens };
  }

  async login(emailOrUsername: string, password: string): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = generateTokens(user.id, user.email);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    const { password: _, refreshToken: __, ...userWithoutSensitive } = user;
    return { user: userWithoutSensitive, tokens };
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const user = await prisma.user.findFirst({
      where: { refreshToken },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = generateTokens(user.id, user.email);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
