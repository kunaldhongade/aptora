import React, { Suspense } from 'react';
import { PageLoading } from '../components/ui/LoadingAnimation';

// Lazy load wrapper with error boundary
export const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Suspense fallback={<PageLoading text="Loading page..." />}>
        {children}
    </Suspense>
);
