
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatCard from '../components/StatCard';

describe('StatCard Component', () => {
    const mockIcon = <svg data-testid="test-icon" />;

    it('renders title and value correctly', () => {
        render(<StatCard icon={mockIcon} title="Total Suppliers" value="123" />);

        expect(screen.getByText('Total Suppliers')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
        render(<StatCard icon={mockIcon} title="Stat" value="10" subtitle="+5% increase" />);

        expect(screen.getByText('+5% increase')).toBeInTheDocument();
    });

    it('renders icon', () => {
        render(<StatCard icon={mockIcon} title="Stat" value="10" />);

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('applies variant classes correctly', () => {
        const { container } = render(<StatCard icon={mockIcon} title="Red Stat" value="0" variant="red" />);

        // Check if the inner div (icon container) has red classes
        // The structure is: outer div > icon container div > icon
        // We look for "bg-red-50/80" or "text-red-600"

        // Note: Tailwind classes might be split or ordered differently, but we check text content class presence
        const iconContainer = container.querySelector('.bg-red-50\\/80');
        expect(iconContainer).toBeInTheDocument();
        expect(iconContainer).toHaveClass('text-red-600');
    });
});
