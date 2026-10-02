import { z } from 'zod';

const frequencySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily') }),
  z.object({
    type: z.literal('weekdays'),
    days: z.array(z.number().min(0).max(6)),
  }),
  z.object({ type: z.literal('timesPerWeek'), count: z.number().min(1) }),
]);

export const createHabitSchema = z.object({
  name: z.string().trim().min(2).max(60),
  categoryId: z.string(),
  frequency: frequencySchema,
});

export const updateHabitSchema = createHabitSchema.partial();
