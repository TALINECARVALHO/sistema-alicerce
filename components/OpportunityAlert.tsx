
import React from 'react';
import { BellIcon, ArrowLeftIcon } from './icons';

interface OpportunityAlertProps {
    count: number;
    onAction: () => void;
}

const OpportunityAlert: React.FC<OpportunityAlertProps> = ({ count, onAction }) => {
    if (count <= 0) return null;

    return (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-6 py-5 rounded-[2rem] shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between border border-blue-400/30 relative overflow-hidden group animate-fade-in-down mx-2 sm:mx-0">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                <BellIcon className="w-32 h-32" />
            </div>

            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            <div className="flex items-center gap-5 relative z-10">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner border border-white/20 relative">
                    <BellIcon className="w-8 h-8 text-yellow-300 animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white ring-2 ring-red-500/20">
                        {count}
                    </span>
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">
                        Você tem {count} Nova{count > 1 ? 's' : ''} Oportunidade{count > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-blue-100/90 text-sm font-medium mt-1">
                        Existem cotações compatíveis com seu ramo de atividade aguardando sua proposta técnica.
                    </p>
                </div>
            </div>

            <button
                onClick={onAction}
                className="mt-6 md:mt-0 whitespace-nowrap px-8 py-4 bg-white text-blue-800 font-black rounded-2xl hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_-5px_rgba(255,255,255,0.3)] flex items-center gap-3 group/btn uppercase text-xs tracking-widest"
            >
                Participar Agora
                <svg className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </button>

            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default OpportunityAlert;
