
import { useToast } from '../contexts/ToastContext';
import React, { useState } from 'react';
import html2canvas from 'html2canvas';

const ScreenshotButton: React.FC = () => {
    const { error: toastError } = useToast();
    const [capturing, setCapturing] = useState(false);

    const handleCapture = async () => {
        setCapturing(true);
        try {
            // Hide the button during capture
            const btn = document.getElementById('screenshot-btn');
            if (btn) btn.style.display = 'none';

            const canvas = await html2canvas(document.body, {
                useCORS: true,
                scale: 1 // Higher scale for better quality if needed
            });

            // Show button again
            if (btn) btn.style.display = 'flex';

            const image = canvas.toDataURL("image/png");

            // Trigger download
            const link = document.createElement('a');
            link.href = image;
            const filename = `alicerce_print_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
            link.download = filename;
            link.click();

        } catch (error) {
            console.error("Screenshot failed:", error);
            toastError("Erro ao capturar tela.");
            // Show button again in case of error
            const btn = document.getElementById('screenshot-btn');
            if (btn) btn.style.display = 'flex';
        } finally {
            setCapturing(false);
        }
    };

    return (
        <button
            id="screenshot-btn"
            onClick={handleCapture}
            disabled={capturing}
            className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all border-4 border-white active:scale-95 group"
            title="Baixar Print da Tela"
        >
            {capturing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Capturar Tela
            </span>
        </button>
    );
};

export default ScreenshotButton;
