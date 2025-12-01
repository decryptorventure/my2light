import { z } from 'zod';

export const CreateCommentSchema = z.object({
    highlightId: z.string().uuid('Highlight ID không hợp lệ'),
    text: z
        .string()
        .trim()
        .min(1, 'Comment không được để trống')
        .max(500, 'Comment không được quá 500 ký tự'),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
