
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to allow enter animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    };

    return (
        <div
            className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-md
            transition-all duration-300 transform 
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            ${styles[type]}
        `}
            role="alert"
        >
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/5 transition-colors"
            >
                <X className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
        </div>
    );
};
