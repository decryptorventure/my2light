import { z } from 'zod';

export const TopUpSchema = z.object({
    amount: z
        .number()
        .positive('Số tiền phải lớn hơn 0')
        .min(10000, 'Số tiền tối thiểu 10,000đ')
        .max(50000000, 'Số tiền tối đa 50,000,000đ'),
    method: z
        .string()
        .refine(
            (val) => ['momo', 'zalopay', 'bank_transfer'].includes(val),
            'Phương thức thanh toán không hợp lệ'
        ),
});

export type TopUpInput = z.infer<typeof TopUpSchema>;
