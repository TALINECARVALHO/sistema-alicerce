
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/ui/Toast';

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = useCallback((msg: string, dur?: number) => addToast('success', msg, dur), [addToast]);
    const error = useCallback((msg: string, dur?: number) => addToast('error', msg, dur), [addToast]);
    const info = useCallback((msg: string, dur?: number) => addToast('info', msg, dur), [addToast]);
    const warning = useCallback((msg: string, dur?: number) => addToast('warning', msg, dur), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            type={toast.type}
                            message={toast.message}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
