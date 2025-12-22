import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toast } from '../components/ui/Toast';

describe('Toast Component', () => {
    it('renders the message correctly', () => {
        render(<Toast message="Test Message" type="info" onClose={() => { }} />);
        expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('renders the correct type styles', () => {
        const { container } = render(<Toast message="Success" type="success" onClose={() => { }} />);
        expect(container.firstChild).toHaveClass('bg-green-50');
    });

    it('calls onClose when closed', () => {
        const handleClose = vi.fn();
        render(<Toast message="Test" type="info" onClose={handleClose} />);

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
