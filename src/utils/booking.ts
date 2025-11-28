export function calculateBookingCost(
    startTime: Date,
    endTime: Date,
    pricePerHour: number
): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const cost = durationHours * pricePerHour;

    // Round to nearest 1000
    return Math.round(cost / 1000) * 1000;
}

export function isSlotAvailable(
    requestedStart: Date,
    requestedEnd: Date,
    existingBookings: Array<{ start_time: string; end_time: string }>
): boolean {
    const reqStart = requestedStart.getTime();
    const reqEnd = requestedEnd.getTime();

    for (const booking of existingBookings) {
        const bookingStart = new Date(booking.start_time).getTime();
        const bookingEnd = new Date(booking.end_time).getTime();

        // Check for overlap (excluding exact boundaries)
        if (reqStart < bookingEnd && reqEnd > bookingStart) {
            return false;
        }
    }

    return true;
}

interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
}

export function getTimeSlots(
    date: Date,
    openTime: string,
    closeTime: string,
    intervalMinutes: number = 60,
    existingBookings: Array<{ start_time: string; end_time: string }> = []
): TimeSlot[] {
    const slots: TimeSlot[] = [];

    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(openHour, openMin, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(closeHour, closeMin, 0, 0);

    let currentTime = new Date(startDate);

    while (currentTime < endDate) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);

        if (slotEnd > endDate) break;

        const available = isSlotAvailable(slotStart, slotEnd, existingBookings);

        slots.push({
            start: slotStart.toTimeString().slice(0, 5),
            end: slotEnd.toTimeString().slice(0, 5),
            available,
        });

        currentTime = slotEnd;
    }

    return slots;
}

export function validateBookingTime(
    startTime: Date,
    endTime: Date,
    openTime: string,
    closeTime: string
): { valid: boolean; error?: string } {
    // Check if end is after start
    if (endTime <= startTime) {
        return { valid: false, error: 'End time must be after start time' };
    }

    // Check minimum duration (30 minutes)
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < 30) {
        return { valid: false, error: 'Minimum booking duration is 30 minutes' };
    }

    // Check if within operating hours
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const startHour = startTime.getHours();
    const startMin = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMin = endTime.getMinutes();

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (startMinutes < openMinutes) {
        return { valid: false, error: `Court opens at ${openTime}` };
    }

    if (endMinutes > closeMinutes) {
        return { valid: false, error: `Court closes at ${closeTime}` };
    }

    return { valid: true };
}
