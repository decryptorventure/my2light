import { create } from 'zustand';
import { Court, Package } from '../types';

interface BookingState {
    selectedCourt: Court | null;
    selectedPackage: Package | null;
    selectedDate: Date;
    selectedTime: string | null; // "HH:mm" format

    // Actions
    selectCourt: (court: Court) => void;
    selectPackage: (pkg: Package) => void;
    selectDate: (date: Date) => void;
    selectTime: (time: string) => void;
    resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    selectedCourt: null,
    selectedPackage: null,
    selectedDate: new Date(),
    selectedTime: null,

    selectCourt: (court) => set({ selectedCourt: court }),
    selectPackage: (pkg) => set({ selectedPackage: pkg }),
    selectDate: (date) => set({ selectedDate: date }),
    selectTime: (time) => set({ selectedTime: time }),

    resetBooking: () => set({
        selectedCourt: null,
        selectedPackage: null,
        selectedDate: new Date(),
        selectedTime: null
    })
}));
