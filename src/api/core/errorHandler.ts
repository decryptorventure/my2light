import { ApiError, ErrorCode } from './types';
import * as Sentry from '@sentry/react';

// Re-export ErrorCode for convenience
export { ErrorCode } from './types';

// Vietnamese error messages
const ERROR_MESSAGES: Record<ErrorCode, string> = {
    // Auth
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Số điện thoại hoặc mật khẩu không đúng',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
    [ErrorCode.AUTH_UNAUTHORIZED]: 'Bạn không có quyền thực hiện thao tác này',
    [ErrorCode.AUTH_SESSION_NOT_FOUND]: 'Phiên đăng nhập không tồn tại',
    [ErrorCode.AUTH_PHONE_INVALID]: 'Số điện thoại không hợp lệ',
    [ErrorCode.AUTH_PASSWORD_WEAK]: 'Mật khẩu phải có ít nhất 6 ký tự',

    // Booking
    [ErrorCode.BOOKING_COURT_NOT_AVAILABLE]: 'Sân không có sẵn trong khung giờ này',
    [ErrorCode.BOOKING_INVALID_TIME]: 'Thời gian đặt sân không hợp lệ',
    [ErrorCode.BOOKING_INSUFFICIENT_CREDITS]: 'Số dư không đủ để đặt sân',
    [ErrorCode.BOOKING_NOT_FOUND]: 'Không tìm thấy booking',
    [ErrorCode.BOOKING_CANNOT_CANCEL]: 'Không thể hủy booking này',
    [ErrorCode.BOOKING_ALREADY_CHECKED_IN]: 'Đã check-in booking này rồi',

    // Video
    [ErrorCode.VIDEO_UPLOAD_FAILED]: 'Upload video thất bại',
    [ErrorCode.VIDEO_PROCESSING_FAILED]: 'Xử lý video thất bại',
    [ErrorCode.VIDEO_INVALID_FORMAT]: 'Định dạng video không hợp lệ',
    [ErrorCode.VIDEO_TOO_LARGE]: 'Video quá lớn (tối đa 100MB)',
    [ErrorCode.VIDEO_SEGMENTS_NOT_FOUND]: 'Không tìm thấy segments video',

    // Payment
    [ErrorCode.PAYMENT_FAILED]: 'Thanh toán thất bại',
    [ErrorCode.PAYMENT_INVALID_AMOUNT]: 'Số tiền không hợp lệ',
    [ErrorCode.PAYMENT_METHOD_INVALID]: 'Phương thức thanh toán không hợp lệ',
    [ErrorCode.PAYMENT_TRANSACTION_NOT_FOUND]: 'Không tìm thấy giao dịch',

    // Social
    [ErrorCode.SOCIAL_NOT_FOUND]: 'Không tìm thấy nội dung',
    [ErrorCode.SOCIAL_ALREADY_LIKED]: 'Đã thích bài viết này',
    [ErrorCode.SOCIAL_ALREADY_FOLLOWING]: 'Đã follow người dùng này',
    [ErrorCode.SOCIAL_CANNOT_FOLLOW_SELF]: 'Không thể follow chính mình',

    // Court
    [ErrorCode.COURT_NOT_FOUND]: 'Không tìm thấy sân',
    [ErrorCode.COURT_INACTIVE]: 'Sân đang tạm ngưng hoạt động',
    [ErrorCode.COURT_INVALID_HOURS]: 'Giờ hoạt động không hợp lệ',

    // Network
    [ErrorCode.NETWORK_TIMEOUT]: 'Kết nối bị timeout. Vui lòng thử lại',
    [ErrorCode.NETWORK_OFFLINE]: 'Không có kết nối internet',
    [ErrorCode.NETWORK_SERVER_ERROR]: 'Lỗi server. Vui lòng thử lại sau',

    // Validation
    [ErrorCode.VALIDATION_FAILED]: 'Dữ liệu không hợp lệ',
    [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Trường này là bắt buộc',
    [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Định dạng không hợp lệ',

    // Generic
    [ErrorCode.UNKNOWN_ERROR]: 'Có lỗi xảy ra. Vui lòng thử lại',
};

/**
 * Create standardized API error
 */
export function createApiError(
    code: ErrorCode,
    details?: any,
    customMessage?: string
): ApiError {
    const error: ApiError = {
        code,
        message: customMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
        details,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
    };

    return error;
}

/**
 * Parse error from axios or supabase
 */
export function parseError(error: any): ApiError {
    // Axios error
    if (error.isAxiosError) {
        if (!error.response) {
            // Network error
            return createApiError(ErrorCode.NETWORK_OFFLINE);
        }

        if (error.code === 'ECONNABORTED') {
            return createApiError(ErrorCode.NETWORK_TIMEOUT);
        }

        // Parse response error
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
            return createApiError(ErrorCode.AUTH_UNAUTHORIZED, data);
        }

        if (status >= 500) {
            return createApiError(ErrorCode.NETWORK_SERVER_ERROR, data);
        }

        // If error has code, use it
        if (data?.code && data.code in ERROR_MESSAGES) {
            const errorCode = data.code as ErrorCode;
            return {
                code: errorCode,
                message: data.message || ERROR_MESSAGES[errorCode],
                details: data.details,
                timestamp: new Date().toISOString(),
                requestId: data.requestId || generateRequestId(),
            };
        }
    }

    // Supabase error
    if (error.message) {
        // Map common Supabase errors
        if (error.message.includes('JWT')) {
            return createApiError(ErrorCode.AUTH_TOKEN_EXPIRED);
        }

        if (error.message.includes('not found')) {
            return createApiError(ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Unknown error
    return createApiError(ErrorCode.UNKNOWN_ERROR, error);
}

/**
 * Log error to Sentry
 */
export function logError(error: ApiError, context?: any) {
    console.error('[API Error]', error);

    // Send to Sentry
    Sentry.captureException(new Error(error.message), {
        tags: {
            errorCode: error.code,
            requestId: error.requestId,
        },
        extra: {
            ...error,
            context,
        },
        level: 'error',
    });
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
