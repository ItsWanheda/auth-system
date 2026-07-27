import { z } from 'zod';

export const getMeSchema = z.object({
  // No body validation needed, just authorization check
});

export type GetMeInput = z.infer<typeof getMeSchema>;