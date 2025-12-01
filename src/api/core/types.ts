// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// Error Types
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Error Codes
export enum ErrorCode {
  // Auth errors (AUTH_*)
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_UNAUTHORIZED = 'AUTH_003',
  AUTH_SESSION_NOT_FOUND = 'AUTH_004',
  AUTH_PHONE_INVALID = 'AUTH_005',
  AUTH_PASSWORD_WEAK = 'AUTH_006',
  
  // Booking errors (BOOKING_*)
  BOOKING_COURT_NOT_AVAILABLE = 'BOOKING_001',
  BOOKING_INVALID_TIME = 'BOOKING_002',
  BOOKING_INSUFFICIENT_CREDITS = 'BOOKING_003',
  BOOKING_NOT_FOUND = 'BOOKING_004',
  BOOKING_CANNOT_CANCEL = 'BOOKING_005',
  BOOKING_ALREADY_CHECKED_IN = 'BOOKING_006',
  
  // Video errors (VIDEO_*)
  VIDEO_UPLOAD_FAILED = 'VIDEO_001',
  VIDEO_PROCESSING_FAILED = 'VIDEO_002',
  VIDEO_INVALID_FORMAT = 'VIDEO_003',
  VIDEO_TOO_LARGE = 'VIDEO_004',
  VIDEO_SEGMENTS_NOT_FOUND = 'VIDEO_005',
  
  // Payment errors (PAYMENT_*)
  PAYMENT_FAILED = 'PAYMENT_001',
  PAYMENT_INVALID_AMOUNT = 'PAYMENT_002',
  PAYMENT_METHOD_INVALID = 'PAYMENT_003',
  PAYMENT_TRANSACTION_NOT_FOUND = 'PAYMENT_004',
  
  // Social errors (SOCIAL_*)
  SOCIAL_NOT_FOUND = 'SOCIAL_001',
  SOCIAL_ALREADY_LIKED = 'SOCIAL_002',
  SOCIAL_ALREADY_FOLLOWING = 'SOCIAL_003',
  SOCIAL_CANNOT_FOLLOW_SELF = 'SOCIAL_004',
  
  // Court errors (COURT_*)
  COURT_NOT_FOUND = 'COURT_001',
  COURT_INACTIVE = 'COURT_002',
  COURT_INVALID_HOURS = 'COURT_003',
  
  // Network errors (NETWORK_*)
  NETWORK_TIMEOUT = 'NETWORK_001',
  NETWORK_OFFLINE = 'NETWORK_002',
  NETWORK_SERVER_ERROR = 'NETWORK_003',
  
  // Validation errors (VALIDATION_*)
  VALIDATION_FAILED = 'VALIDATION_001',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_002',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_003',
  
  // Generic errors
  UNKNOWN_ERROR = 'ERROR_000',
}

// Request Configuration
export interface RequestConfig {
  skipAuth?: boolean;
  skipValidation?: boolean;
  timeout?: number;
  retries?: number;
}
