import express from 'express';
import { prisma } from './lib/prisma.js';
import { fromFrequency, toHabitResponse } from './mappers/habit.js';
import { createHabitSchema, updateHabitSchema } from './schemas/habit.js';

const app = express();
app.use(express.json());

app.get('/habits/:id', async (req, res) => {
  const habitId = req.params.id;
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { completions: true },
  });
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  return res.status(200).json(toHabitResponse(habit));
});

app.get('/habits', async (req, res) => {
  const habits = await prisma.habit.findMany({
    include: { completions: true },
  });
  const habitsResponse = habits.map((h) => toHabitResponse(h));
  res.json(habitsResponse);
});

app.post('/habits', async (req, res) => {
  const result = createHabitSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }
  const frequency = fromFrequency(result.data.frequency);
  const createdHabit = await prisma.habit.create({
    data: {
      name: result.data.name,
      categoryId: result.data.categoryId,
      ...frequency,
    },
    include: { completions: true },
  });
  return res.status(201).json(toHabitResponse(createdHabit));
});

app.delete('/habits/:id', async (req, res) => {
  const id = req.params.id;

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  await prisma.habit.delete({ where: { id } });
  return res.status(204).send();
});

app.patch('/habits/:id', async (req, res) => {
  const id = req.params.id;
  const result = updateHabitSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  const { frequency, ...rest } = result.data;
  const data = {
    ...rest,
    ...(frequency ? fromFrequency(frequency) : {}),
  };

  try {
    const updatedHabit = await prisma.habit.update({
      where: { id },
      data,
      include: { completions: true },
    });

    return res.status(200).json(toHabitResponse(updatedHabit));
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    throw error;
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
