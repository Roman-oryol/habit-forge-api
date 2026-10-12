import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../schemas/auth.js';
import { isPrismaError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { toUserResponse } from '../mappers/user.js';
import { JWT_SECRET } from '../config.js';

export const authRouter = Router();

const DUMMY_HASH = await bcryptjs.hash('dummy-password', 10);

authRouter.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  const { email, password } = result.data;
  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    const createdUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });
    return res.status(201).json(toUserResponse(createdUser));
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    throw error;
  }
});

authRouter.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });
  const isPasswordValid = await bcryptjs.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, {
    expiresIn: '1h',
  });
  return res.json({ token, user: toUserResponse(user) });
});
