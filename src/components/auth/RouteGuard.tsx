'use client'

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

// Paths that don't require authentication
const publicPaths = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/'];

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't do anything while auth is loading
    if (isLoading) return;

    const isPublicPath = publicPaths.some(path => 
      pathname?.startsWith(path) || pathname === path
    );

    // If the path requires auth and user is not authenticated, redirect to login
    if (!isPublicPath && !isAuthenticated) {
      router.push('/auth/signin');
    } 
    
    // If user is authenticated and on a login/signup page, redirect to dashboard
    if (isAuthenticated && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Render children normally
  return <>{children}</>;
};

export default RouteGuard; 