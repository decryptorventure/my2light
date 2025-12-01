import { z } from 'zod';

/**
 * Vietnam phone number regex
 * Matches: 0xxx xxx xxx or +84xxx xxx xxx
 */
const VIETNAM_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * Login Schema
 */
export const LoginSchema = z.object({
    phone: z
        .string()
        .trim()
        .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại không hợp lệ'),
    password: z
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Register Schema
 */
export const RegisterSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Tên phải có ít nhất 2 ký tự')
        .max(50, 'Tên không được quá 50 ký tự'),
    phone: z
        .string()
        .trim()
        .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại không hợp lệ'),
    password: z
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(100, 'Mật khẩu không được quá 100 ký tự'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Update Profile Schema
 */
export const UpdateProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Tên phải có ít nhất 2 ký tự')
        .max(50, 'Tên không được quá 50 ký tự')
        .optional(),
    phone: z
        .string()
        .trim()
        .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại không hợp lệ')
        .optional(),
    bio: z
        .string()
        .trim()
        .max(200, 'Bio không được quá 200 ký tự')
        .optional(),
    avatar: z
        .string()
        .url('Avatar phải là URL hợp lệ')
        .optional(),
    is_public: z
        .boolean()
        .optional(),
    has_onboarded: z
        .boolean()
        .optional(),
    credits: z
        .number()
        .nonnegative()
        .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Upload Avatar Schema
 */
export const UploadAvatarSchema = z.object({
    file: z
        .instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, 'File không được lớn hơn 5MB')
        .refine(
            (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
            'File phải là ảnh (JPEG, PNG, hoặc WebP)'
        ),
});

export type UploadAvatarInput = z.infer<typeof UploadAvatarSchema>;
