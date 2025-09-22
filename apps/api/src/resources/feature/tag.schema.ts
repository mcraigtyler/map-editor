import { z } from 'zod';

export const tagKeySchema = z
  .string()
  .trim()
  .min(1, 'Tag key is required.')
  .max(64, 'Tag key must be 64 characters or fewer.')
  .regex(/^[A-Za-z0-9:_-]+$/, 'Tag key may only include letters, numbers, underscores, hyphens, or colons.');

export const tagValueSchema = z
  .string()
  .trim()
  .min(1, 'Tag value is required.')
  .max(256, 'Tag value must be 256 characters or fewer.');

export const tagRecordSchema = z.record(tagKeySchema, tagValueSchema);

export const tagMutationSchema = z
  .object({
    set: tagRecordSchema.optional(),
    delete: z.array(tagKeySchema).optional(),
  })
  .refine(
    (value) => {
      const hasSet = value.set ? Object.keys(value.set).length > 0 : false;
      const hasDelete = value.delete ? value.delete.length > 0 : false;
      return hasSet || hasDelete;
    },
    { message: 'At least one tag change must be provided.' }
  );

export type TagRecord = z.infer<typeof tagRecordSchema>;
export type TagMutation = z.infer<typeof tagMutationSchema>;
