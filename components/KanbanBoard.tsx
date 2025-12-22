
import React from 'react';
import { Demand, DemandStatus, Group } from '../types';
import { STATUS_COLORS } from '../constants';

interface KanbanBoardProps {
    demands: Demand[];
    groups: Group[];
    onSelectDemand: (demand: Demand) => void;
}

const KanbanColumn: React.FC<{ title: string; demands: Demand[]; color: string; onSelect: (d: Demand) => void }> = ({ title, demands, color, onSelect }) => (
    <div className="flex-1 min-w-[300px] bg-slate-100 rounded-xl p-4 flex flex-col h-full border border-slate-200">
        <div className={`font-bold text-sm uppercase tracking-wide mb-4 pb-2 border-b-2 ${color} text-slate-600 flex justify-between`}>
            {title} <span className="bg-slate-200 px-2 py-0.5 rounded-full text-xs">{demands.length}</span>
        </div>
        <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
            {demands.map(d => (
                <div key={d.id} onClick={() => onSelect(d)} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md cursor-pointer transition-all hover:-translate-y-1">
                    <div className="flex justify-between mb-2"><span className="text-xs font-mono text-slate-400">{d.protocol}</span><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{d.priority}</span></div>
                    <h4 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2">{d.title}</h4>
                    <p className="text-xs text-slate-500">{d.requestingDepartment}</p>
                    <p className="text-xs text-slate-400 mt-2 text-right">{new Date(d.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
            ))}
        </div>
    </div>
);

const KanbanBoard: React.FC<KanbanBoardProps> = ({ demands, onSelectDemand }) => {
    // Grouping - Removed 'pending' (Aguardando Análise Almoxarifado) column
    const cols = {
        draft: demands.filter(d => d.status === DemandStatus.RASCUNHO),
        // pending: demands.filter(d => d.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO), // Removed
        bidding: demands.filter(d => d.status === DemandStatus.AGUARDANDO_PROPOSTA),
        analysis: demands.filter(d => d.status === DemandStatus.EM_ANALISE),
        done: demands.filter(d => [DemandStatus.VENCEDOR_DEFINIDO, DemandStatus.CONCLUIDA, DemandStatus.FECHADA].includes(d.status)),
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-220px)] overflow-x-auto pb-4">
            <KanbanColumn title="Rascunho" demands={cols.draft} color="border-gray-400" onSelect={onSelectDemand} />
            {/* Warehouse Analysis Column Removed */}
            <KanbanColumn title="Em Cotação" demands={cols.bidding} color="border-blue-400" onSelect={onSelectDemand} />
            <KanbanColumn title="Análise Propostas" demands={cols.analysis} color="border-yellow-400" onSelect={onSelectDemand} />
            <KanbanColumn title="Concluída / Vencedor" demands={cols.done} color="border-green-400" onSelect={onSelectDemand} />
        </div>
    );
};

export default KanbanBoard;
