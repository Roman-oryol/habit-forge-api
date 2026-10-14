import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { fromFrequency, toHabitResponse } from '../mappers/habit.js';
import {
  createHabitSchema,
  toggleHabitSchema,
  updateHabitSchema,
} from '../schemas/habit.js';
import { isPrismaError } from '../lib/errors.js';
import { getUserId } from '../middleware/auth.js';

export const habitsRouter = Router();

async function ensureCategoryBelongsToUser(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId, userId },
  });
  return category !== null;
}

habitsRouter.get('/', async (req, res) => {
  const userId = getUserId(req);
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { completions: true },
  });
  res.json(habits.map((h) => toHabitResponse(h)));
});

habitsRouter.get('/:id', async (req, res) => {
  const userId = getUserId(req);
  const habit = await prisma.habit.findUnique({
    where: { id: req.params.id, userId },
    include: { completions: true },
  });
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  return res.status(200).json(toHabitResponse(habit));
});

habitsRouter.post('/', async (req, res) => {
  const result = createHabitSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  const userId = getUserId(req);

  if (!(await ensureCategoryBelongsToUser(result.data.categoryId, userId))) {
    return res.status(400).json({ error: 'Category not found' });
  }

  const frequency = fromFrequency(result.data.frequency);

  try {
    const createdHabit = await prisma.habit.create({
      data: {
        name: result.data.name,
        categoryId: result.data.categoryId,
        userId,
        ...frequency,
      },
      include: { completions: true },
    });
    return res.status(201).json(toHabitResponse(createdHabit));
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2003') {
      return res.status(400).json({ error: 'Category not found' });
    }
    throw error;
  }
});

habitsRouter.patch('/:id', async (req, res) => {
  const userId = getUserId(req);
  const result = updateHabitSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  if (result.data.categoryId) {
    if (!(await ensureCategoryBelongsToUser(result.data.categoryId, userId))) {
      return res.status(400).json({ error: 'Category not found' });
    }
  }

  const { frequency, ...rest } = result.data;
  const data = {
    ...rest,
    ...(frequency ? fromFrequency(frequency) : {}),
  };

  try {
    const updatedHabit = await prisma.habit.update({
      where: { id: req.params.id, userId },
      data,
      include: { completions: true },
    });
    return res.status(200).json(toHabitResponse(updatedHabit));
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2025') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    throw error;
  }
});

habitsRouter.post('/:id/toggle', async (req, res) => {
  const userId = getUserId(req);
  const habitId = req.params.id;

  const validateResult = toggleHabitSchema.safeParse(req.body);
  if (!validateResult.success) {
    return res.status(400).json({ error: validateResult.error.issues });
  }

  const ownHabit = await prisma.habit.findUnique({
    where: { id: habitId, userId },
    select: { id: true },
  });
  if (!ownHabit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  const { date } = validateResult.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.completion.findUnique({
        where: { habitId_date: { habitId, date: new Date(date) } },
      });

      if (existing) {
        await tx.completion.delete({ where: { id: existing.id } });
      } else {
        await tx.completion.create({ data: { habitId, date: new Date(date) } });
      }

      return tx.habit.findUnique({
        where: { id: habitId },
        include: { completions: true },
      });
    });

    if (!result) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    return res.status(200).json(toHabitResponse(result));
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2003') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    throw error;
  }
});

habitsRouter.delete('/:id', async (req, res) => {
  const userId = getUserId(req);
  const id = req.params.id;

  const habit = await prisma.habit.findUnique({ where: { id, userId } });
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  await prisma.habit.delete({ where: { id, userId } });
  return res.status(204).send();
});
