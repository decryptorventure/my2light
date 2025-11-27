import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../../pages/Login';
import { render } from '../../../src/test/utils';
import { supabase } from '../../../lib/supabase';

// Mock dependencies
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

vi.mock('../../../lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signInWithOAuth: vi.fn(),
            refreshSession: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
            insert: vi.fn(),
        })),
    },
}));

vi.mock('../../../stores/authStore', () => ({
    useAuthStore: () => ({
        refreshProfile: vi.fn(),
    }),
}));

vi.mock('../../../lib/confetti', () => ({
    celebrate: vi.fn(),
}));

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form by default', () => {
        render(<Login />);
        expect(screen.getByText(/chào mừng trở lại/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
    });

    it('switches to signup mode', async () => {
        const user = userEvent.setup();
        render(<Login />);
        const switchButton = screen.getByText(/đăng ký ngay/i);
        await user.click(switchButton);

        expect(await screen.findByText(/tạo tài khoản miễn phí/i)).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: /tạo tài khoản/i })).toBeInTheDocument();
    });

    it('validates empty inputs', async () => {
        const user = userEvent.setup();
        render(<Login />);
        const submitButton = screen.getByRole('button', { name: /đăng nhập/i });

        await user.click(submitButton);

        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('validates short password', async () => {
        const user = userEvent.setup();
        render(<Login />);
        const emailInput = screen.getByPlaceholderText('name@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /đăng nhập/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, '123');
        await user.click(submitButton);

        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('calls signInWithPassword on valid submission', async () => {
        const user = userEvent.setup();
        // Mock successful login
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: { user: { id: '123' } },
            error: null,
        });
        (supabase.from as any).mockReturnValue({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: { has_onboarded: true } })
                })
            })
        });

        render(<Login />);
        const emailInput = screen.getByPlaceholderText('name@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /đăng nhập/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });
    });
});
