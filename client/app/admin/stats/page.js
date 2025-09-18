'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/navigation';
import AdminStats from '@/components/admin-stats';

export default function AdminStatsPage() {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (!isLoading && isAuthenticated && !isAdmin()) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, isAdmin, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading FleetLink...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin()) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />
            <AdminStats />
        </div>
    );
}
