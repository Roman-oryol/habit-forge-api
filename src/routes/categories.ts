import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/category.js';
import { isPrismaError } from './habits.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { habits: true },
  });
  res.json(categories);
});

categoriesRouter.get('/:id', async (req, res) => {
  const categoryId = req.params.id;
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { habits: true },
  });

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  return res.status(200).json(category);
});

categoriesRouter.post('/', async (req, res) => {
  const result = createCategorySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  const createdCategory = await prisma.category.create({
    data: {
      name: result.data.name,
    },
  });
  return res.status(201).json(createdCategory);
});

categoriesRouter.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const result = updateCategorySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }

  try {
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: result.data,
    });
    return res.status(200).json(updatedCategory);
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    throw error;
  }
});

categoriesRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  await prisma.category.delete({ where: { id } });
  return res.status(204).send();
});
