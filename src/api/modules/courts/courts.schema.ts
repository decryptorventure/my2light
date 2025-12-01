import { z } from 'zod';

/**
 * Create Court Schema
 */
export const CreateCourtSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'Tên sân phải có ít nhất 3 ký tự')
        .max(100, 'Tên sân không được quá 100 ký tự'),
    address: z
        .string()
        .trim()
        .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
        .max(200, 'Địa chỉ không được quá 200 ký tự'),
    description: z
        .string()
        .trim()
        .max(500, 'Mô tả không được quá 500 ký tự')
        .optional(),
    pricePerHour: z
        .number()
        .positive('Giá phải lớn hơn 0')
        .max(10000000, 'Giá không hợp lệ'),
    openTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ mở cửa không hợp lệ (HH:MM)'),
    closeTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ đóng cửa không hợp lệ (HH:MM)'),
    imageUrl: z
        .string()
        .url('URL ảnh không hợp lệ')
        .optional(),
    facilities: z
        .array(z.string())
        .max(10, 'Tối đa 10 tiện ích')
        .optional(),
    features: z
        .array(z.string())
        .max(10, 'Tối đa 10 đặc điểm')
        .optional(),
});

export type CreateCourtInput = z.infer<typeof CreateCourtSchema>;

/**
 * Update Court Schema
 */
export const UpdateCourtSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'Tên sân phải có ít nhất 3 ký tự')
        .max(100, 'Tên sân không được quá 100 ký tự')
        .optional(),
    address: z
        .string()
        .trim()
        .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
        .max(200, 'Địa chỉ không được quá 200 ký tự')
        .optional(),
    description: z
        .string()
        .trim()
        .max(500, 'Mô tả không được quá 500 ký tự')
        .optional(),
    pricePerHour: z
        .number()
        .positive('Giá phải lớn hơn 0')
        .max(10000000, 'Giá không hợp lệ')
        .optional(),
    openTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ mở cửa không hợp lệ (HH:MM)')
        .optional(),
    closeTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ đóng cửa không hợp lệ (HH:MM)')
        .optional(),
    is_active: z.boolean().optional(),
    status: z
        .enum(['live', 'busy', 'available', 'maintenance'])
        .optional(),
});

export type UpdateCourtInput = z.infer<typeof UpdateCourtSchema>;
