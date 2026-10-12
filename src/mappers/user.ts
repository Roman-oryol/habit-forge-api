import { Prisma } from '../generated/prisma/client.js';

type User = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
  };
}>;

export function toUserResponse(row: User) {
  return {
    id: row.id,
    email: row.email,
  };
}
