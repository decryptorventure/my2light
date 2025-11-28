export function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0đ';
    }

    const rounded = Math.round(amount);
    return new Intl.NumberFormat('vi-VN').format(rounded) + 'đ';
}

export function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
        return '0:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDistance(meters: number | null | undefined): string {
    if (meters === null || meters === undefined || isNaN(meters)) {
        return '0m';
    }

    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }

    const km = meters / 1000;
    return `${km.toFixed(1)}km`;
}

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

export function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}
