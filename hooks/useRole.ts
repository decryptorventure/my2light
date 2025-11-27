import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

export type UserRole = 'player' | 'court_owner' | 'both';

export const useRole = () => {
    const [role, setRole] = useState<UserRole>('player');
    const [activeRole, setActiveRole] = useState<UserRole>('player');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRole();
    }, []);

    const loadRole = async () => {
        const res = await ApiService.getCurrentUser();
        if (res.success && res.data) {
            const userRole = res.data.role || 'player';
            setRole(userRole);

            // Get active role from localStorage or default to user's role
            const savedActiveRole = localStorage.getItem('activeRole') as UserRole;
            if (savedActiveRole && isValidRoleSwitch(userRole, savedActiveRole)) {
                setActiveRole(savedActiveRole);
            } else {
                setActiveRole(userRole === 'both' ? 'player' : userRole);
            }
        }
        setLoading(false);
    };

    const isValidRoleSwitch = (userRole: UserRole, targetRole: UserRole): boolean => {
        if (userRole === 'both') return true;
        if (userRole === targetRole) return true;
        return false;
    };

    const switchRole = (newRole: UserRole) => {
        if (!isValidRoleSwitch(role, newRole)) {
            console.error('Invalid role switch attempt');
            return false;
        }

        setActiveRole(newRole);
        localStorage.setItem('activeRole', newRole);
        return true;
    };

    const canAccessAdmin = role === 'court_owner' || role === 'both';
    const canAccessPlayer = role === 'player' || role === 'both';

    return {
        role,
        activeRole,
        switchRole,
        loading,
        canAccessAdmin,
        canAccessPlayer,
        isAdmin: activeRole === 'court_owner'
    };
};
