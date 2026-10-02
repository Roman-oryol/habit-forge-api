import type { Prisma } from '../generated/prisma/client.js';
import { Frequency } from '../types/habit.js';

type HabitWithCompletions = Prisma.HabitGetPayload<{
  include: { completions: true };
}>;

const frequencyTypes = {
  daily: 'daily',
  weekdays: 'weekdays',
  timesPerWeek: 'timesPerWeek',
} as const;

function toFrequency(row: HabitWithCompletions): Frequency {
  switch (row.frequencyType) {
    case frequencyTypes.daily:
      return { type: frequencyTypes.daily };
    case frequencyTypes.weekdays:
      return { type: frequencyTypes.weekdays, days: row.frequencyDays };
    case frequencyTypes.timesPerWeek:
      return {
        type: frequencyTypes.timesPerWeek,
        count: row.frequencyCount ?? 0,
      };
    default:
      throw new Error(`Unsupported frequency type: ${row.frequencyType}`);
  }
}

export function fromFrequency(
  frequency: Frequency,
): Pick<
  HabitWithCompletions,
  'frequencyType' | 'frequencyDays' | 'frequencyCount'
> {
  switch (frequency.type) {
    case frequencyTypes.daily:
      return {
        frequencyType: frequencyTypes.daily,
        frequencyDays: [],
        frequencyCount: null,
      };
    case frequencyTypes.weekdays:
      return {
        frequencyType: frequencyTypes.weekdays,
        frequencyDays: frequency.days,
        frequencyCount: null,
      };
    case frequencyTypes.timesPerWeek:
      return {
        frequencyType: frequencyTypes.timesPerWeek,
        frequencyDays: [],
        frequencyCount: frequency.count,
      };
  }
}

export function toHabitResponse(row: HabitWithCompletions) {
  const frequency = toFrequency(row);
  const completions = row.completions.map((c) =>
    c.date.toISOString().slice(0, 10),
  );

  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    createdAt: row.createdAt.toISOString(),
    frequency,
    completions,
  };
}
