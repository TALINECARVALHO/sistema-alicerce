
import React, { useEffect, useCallback } from 'react';
import { XIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[99999] flex justify-center items-center p-2 sm:p-4 md:p-6 lg:p-10 transition-all duration-300"
      style={{ isolation: 'isolate' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all duration-500 scale-100 opacity-100 animate-modal-enter relative overflow-hidden border border-slate-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal - Rígido, Opaco e Inamovível */}
        <div className="sticky top-0 bg-white px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 flex justify-between items-center z-[110] flex-shrink-0">
          <div className="flex flex-col pr-4 overflow-hidden">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate">{title}</h2>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full mt-2 hidden sm:block"></div>
          </div>
          
          <button 
            onClick={onClose} 
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-2xl transition-all duration-300 group shadow-sm active:scale-95 border border-slate-200"
            title="Fechar (Esc)"
          >
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Fechar Janela</span>
            <XIcon className="w-6 h-6 transform group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Área de Conteúdo com Scroll Próprio */}
        <div className="overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-enter {
          from { transform: scale(0.9) translateY(40px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-modal-enter {
          animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
          border: 3px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Modal;
