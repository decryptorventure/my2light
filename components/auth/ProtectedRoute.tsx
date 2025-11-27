import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { LoadingSpinner } from '../ui/LoadingSpinner';

type UserRole = 'player' | 'court_owner' | 'both';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    redirectTo = '/home'
}) => {
    const { activeRole, loading } = useRole();

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    const hasAccess = allowedRoles.includes(activeRole);

    if (!hasAccess) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};
