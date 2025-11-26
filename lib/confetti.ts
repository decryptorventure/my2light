import confetti from 'canvas-confetti';

interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    zIndex?: number;
}

/**
 * Celebration confetti effect
 */
export const celebrate = (options?: ConfettiOptions) => {
    confetti({
        particleCount: options?.particleCount || 100,
        spread: options?.spread || 70,
        origin: options?.origin || { y: 0.6 },
        colors: options?.colors || ['#a3e635', '#84cc16', '#fbbf24', '#f59e0b'],
        zIndex: options?.zIndex || 9999
    });
};

/**
 * Confetti cannon from sides
 */
export const confettiCannon = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#a3e635', '#84cc16', '#65a30d']
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#fbbf24', '#f59e0b', '#d97706']
        });
    }, 250);
};

/**
 * Fireworks effect
 */
export const fireworks = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#a3e635', '#84cc16'],
            zIndex: 9999
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#fbbf24', '#f59e0b'],
            zIndex: 9999
        });
    }, 200);
};

/**
 * Simple burst
 */
export const burst = () => {
    confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.5 },
        scalar: 1.2,
        drift: 0,
        gravity: 1,
        ticks: 100,
        colors: ['#a3e635', '#84cc16', '#fbbf24', '#f59e0b', '#ffffff'],
        shapes: ['circle', 'square'],
        zIndex: 9999
    });
};

/**
 * Emoji confetti (stars for achievements)
 */
export const emojiConfetti = (emoji: string = '⭐') => {
    const scalar = 2;
    const star = confetti.shapeFromText({ text: emoji, scalar });

    confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.6 },
        scalar,
        shapes: [star],
        zIndex: 9999
    });
};
