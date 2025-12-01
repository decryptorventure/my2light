export interface Transaction {
    id: string;
    userId: string;
    type: 'top_up' | 'booking' | 'refund';
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    method: string;
    createdAt: string;
    description?: string;
}

export interface TopUpData {
    amount: number;
    method: string;
}
