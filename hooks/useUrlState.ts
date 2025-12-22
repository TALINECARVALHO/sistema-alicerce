
import { useState, useEffect, useCallback } from 'react';
import { Page } from '../types';

export function useUrlState(initialPage: Page) {
    const [page, setPage] = useState<Page>(initialPage);
    const [demandId, setDemandId] = useState<string | null>(null);

    // Sync from URL to State on Mount and PopState
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const urlPage = params.get('page') as Page | null;
            const urlDemandId = params.get('demandId');

            if (urlPage) setPage(urlPage);
            else setPage('dashboard'); // Default fallback

            if (urlDemandId) setDemandId(urlDemandId);
            else setDemandId(null);
        };

        // Initial check
        handlePopState();

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Function to update state and push to URL
    const navigate = useCallback((newPage: Page, newDemandId?: string | number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage);

        if (newDemandId) {
            params.set('demandId', String(newDemandId));
        } else {
            params.delete('demandId');
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);

        setPage(newPage);
        setDemandId(newDemandId ? String(newDemandId) : null);
    }, []);

    return { page, demandId, navigate };
}
