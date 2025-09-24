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

export const tagEditorRowSchema = z.object({
  id: z.string(),
  key: tagKeySchema,
  value: tagValueSchema,
});

export const tagEditorFormSchema = z.object({
  rows: z
    .array(tagEditorRowSchema)
    .superRefine((rows, ctx) => {
      const seen = new Map<string, number>();
      rows.forEach((row, index) => {
        const normalized = row.key.toLowerCase();
        if (seen.has(normalized)) {
          const firstIndex = seen.get(normalized)!;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate tag keys are not allowed.',
            path: [firstIndex, 'key'],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate tag keys are not allowed.',
            path: [index, 'key'],
          });
        } else {
          seen.set(normalized, index);
        }
      });
    }),
});

export type TagEditorRow = z.infer<typeof tagEditorRowSchema>;
export type TagEditorFormData = z.infer<typeof tagEditorFormSchema>;
