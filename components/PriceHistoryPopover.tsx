
import React, { useMemo, useState } from 'react';
import { Demand } from '../types';
import { getPriceHistory, PriceHistoryEntry } from '../utils/priceHistory';
import { ClockIcon, DollarIcon, SuppliersIcon, CalendarIcon } from './icons';
import PriceHistoryModal from './PriceHistoryModal';

interface PriceHistoryPopoverProps {
    itemId?: string | number;
    catalogItemId?: string | null;
    description: string;
    demands: Demand[];
    onNavigateToDemand?: (demandId: number) => void;
}

const PriceHistoryPopover: React.FC<PriceHistoryPopoverProps> = ({ catalogItemId, description, demands, onNavigateToDemand }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const history = useMemo(() => {
        return getPriceHistory(description, catalogItemId, demands).slice(0, 5);
    }, [catalogItemId, description, demands]);

    if (history.length === 0) {
        return (
            <span className="text-[10px] text-slate-400 font-medium italic">Sem histórico</span>
        );
    }

    return (
        <div className="relative inline-block">
            <button
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                onClick={() => setIsModalOpen(true)}
                className="p-1 hover:bg-blue-50 rounded-full transition-colors group cursor-pointer"
                title="Clique para ver histórico completo"
            >
                <ClockIcon className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
            </button>

            {isOpen && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-fade-in pointer-events-none">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <DollarIcon className="w-4 h-4 text-emerald-500" />
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">Histórico de Preços</h5>
                    </div>

                    <div className="space-y-3">
                        {history.map((entry, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <span className="text-[11px] font-black text-slate-900">{entry.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span className="truncate flex-1">🏢 {entry.supplierName}</span>
                                    <span className="text-slate-300">#{entry.protocol}</span>
                                </div>
                                {idx < history.length - 1 && <div className="border-b border-slate-50 my-1"></div>}
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 pt-2 text-[9px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded text-center">
                        Referência baseada em {history.length} processos
                    </div>
                </div>
            )}

            <PriceHistoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                description={description}
                catalogItemId={catalogItemId}
                demands={demands}
                onNavigateToDemand={onNavigateToDemand}
            />
        </div>
    );
};

export default PriceHistoryPopover;
