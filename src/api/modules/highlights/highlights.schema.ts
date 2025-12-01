import { z } from 'zod';

export const CreateHighlightSchema = z.object({
    courtId: z.string().uuid('Court ID không hợp lệ'),
    videoUrl: z.string().url('Video URL không hợp lệ').optional(),
    duration: z.number().positive('Duration phải lớn hơn 0').optional(),
    title: z.string().trim().max(100, 'Tiêu đề không quá 100 ký tự').optional(),
    description: z.string().trim().max(500, 'Mô tả không quá 500 ký tự').optional(),
    isPublic: z.boolean().optional(),
});

export type CreateHighlightInput = z.infer<typeof CreateHighlightSchema>;

export const UpdateHighlightSchema = z.object({
    title: z.string().trim().max(100, 'Tiêu đề không quá 100 ký tự').optional(),
    description: z.string().trim().max(500, 'Mô tả không quá 500 ký tự').optional(),
    isPublic: z.boolean().optional(),
});

export type UpdateHighlightInput = z.infer<typeof UpdateHighlightSchema>;

export const UploadVideoSchema = z.object({
    file: z
        .instanceof(Blob)
        .refine((file) => file.size <= 100 * 1024 * 1024, 'Video không được lớn hơn 100MB'),
});

export type UploadVideoInput = z.infer<typeof UploadVideoSchema>;
