/**
 * Browser and device detection utilities
 * Used for iOS Safari compatibility handling
 */

/**
 * Detect if running on iOS Safari
 * iOS Safari has issues with webm playback despite reporting support
 */
export function isIOSSafari(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = navigator.userAgent;

    // Check for iPad, iPhone, or iPod
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;

    // Check for WebKit engine
    const webkit = /WebKit/.test(ua);

    // Exclude Chrome iOS (CriOS) and other browsers
    const notChrome = !(/CriOS|Chrome|Edg/.test(ua));

    return iOS && webkit && notChrome;
}

/**
 * Detect if running on any iOS device (regardless of browser)
 */
export function isIOS(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

/**
 * Detect if running on mobile device
 */
export function isMobile(): boolean {
    if (typeof window === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get user-friendly browser name
 */
export function getBrowserInfo(): { name: string; version: string; os: string } {
    const ua = navigator.userAgent;

    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let os = 'Unknown';

    // Detect browser
    if (/CriOS/.test(ua)) {
        browserName = 'Chrome iOS';
    } else if (/Safari/.test(ua) && /iPhone|iPad/.test(ua)) {
        browserName = 'Safari iOS';
    } else if (/Chrome/.test(ua)) {
        browserName = 'Chrome';
    } else if (/Safari/.test(ua)) {
        browserName = 'Safari';
    } else if (/Firefox/.test(ua)) {
        browserName = 'Firefox';
    }

    // Detect OS
    if (/iPhone/.test(ua)) {
        os = 'iPhone';
    } else if (/iPad/.test(ua)) {
        os = 'iPad';
    } else if (/Android/.test(ua)) {
        os = 'Android';
    } else if (/Mac/.test(ua)) {
        os = 'macOS';
    } else if (/Win/.test(ua)) {
        os = 'Windows';
    }

    return { name: browserName, version: browserVersion, os };
}
