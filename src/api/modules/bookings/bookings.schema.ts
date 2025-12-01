import { z } from 'zod';

export const CreateBookingSchema = z.object({
    courtId: z.string().uuid('Court ID không hợp lệ'),
    startTime: z
        .number()
        .int('Thời gian phải là số nguyên')
        .positive('Thời gian không hợp lệ'),
    durationHours: z
        .number()
        .min(1, 'Thời gian đặt tối thiểu 1 giờ')
        .max(8, 'Thời gian đặt tối đa 8 giờ'),
    packageId: z.string().uuid('Package ID không hợp lệ').optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingSchema = z.object({
    status: z.enum(['pending', 'active', 'completed', 'cancelled']).optional(),
    startTime: z.number().int().positive().optional(),
    endTime: z.number().int().positive().optional(),
});

export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
