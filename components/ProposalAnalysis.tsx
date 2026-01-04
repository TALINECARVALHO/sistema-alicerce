
import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo, useEffect } from 'react';
import { Demand, Proposal, Item } from '../types';
import { getPriceHistory } from '../utils/priceHistory';
import { CheckCircleIcon, DollarIcon, ClockIcon, UsersIcon, ChartBarIcon, ClipboardListIcon, LockClosedIcon, LightningBoltIcon, BoxIcon, SearchIcon } from './icons';
import Modal from './Modal';
import PriceHistoryPopover from './PriceHistoryPopover';
import PriceHistoryModal from './PriceHistoryModal';
import { formatDeliveryTime } from '../utils/delivery';
import ItemsDisplay, { ItemBadge } from './ItemsDisplay';

interface ProposalAnalysisProps {
    demand: Demand;
    allDemands: Demand[];
    onDefineWinner: (demandId: number, winner: any) => Promise<void>;
    onNavigateToDemand?: (demandId: number) => void;
}



interface ItemWinner {
    supplierId: number;
    supplierName: string;
    alias?: string;
    unitPrice: number;
    quantity: number;
    totalValue: number;
}

const ProposalAnalysis: React.FC<ProposalAnalysisProps> = ({ demand, allDemands, onDefineWinner, onNavigateToDemand }) => {
    const { error: toastError, warning } = useToast();
    const [justification, setJustification] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
    const [judgmentMode, setJudgmentMode] = useState<'global' | 'item'>('global');
    const [itemWinners, setItemWinners] = useState<Record<number, ItemWinner>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [viewingProposalItems, setViewingProposalItems] = useState<any | null>(null);
    const [historyItem, setHistoryItem] = useState<{ name: string, catalogItemId?: string | null } | null>(null);

    // Mapeia e anonimiza as propostas garantindo compatibilidade com campos do banco (camelCase/snake_case)
    const anonymizedProposals = useMemo(() => {
        if (!demand.proposals) return [];

        const valid = [...demand.proposals]
            .filter(p => {
                const obs = p.observations || "";
                return !obs.includes('DECLINED');
            })
            .sort((a, b) => a.id - b.id);

        return valid.map((p, index) => {
            const calculatedTotal = p.items.reduce((acc, pItem) => {
                if (pItem.isDeclined) return acc;
                const idToFind = pItem.itemId || (pItem as any).item_id;
                const demandItem = demand.items.find(dItem => dItem.id === idToFind);
                return acc + (demandItem ? demandItem.quantity * pItem.unitPrice : 0);
            }, 0);

            const historicalTotal = demand.items.reduce((acc, dItem) => {
                const itemHistory = getPriceHistory(dItem.description, dItem.catalog_item_id, allDemands);
                const lastPrice = itemHistory.length > 0 ? itemHistory[0].unitPrice : null;
                return acc + (lastPrice ? lastPrice * dItem.quantity : 0);
            }, 0);

            return {
                ...p,
                supplierId: p.supplierId || (p as any).supplier_id,
                alias: `Proponente ${String(index + 1).padStart(2, '0')}`,
                calculatedTotal: calculatedTotal,
                historicalTotal: historicalTotal
            };
        });
    }, [demand.proposals, demand.items, allDemands]);

    const rankedProposals = useMemo(() =>
        [...anonymizedProposals].sort((a, b) => a.calculatedTotal - b.calculatedTotal)
        , [anonymizedProposals]);

    const selectedWinner = useMemo(() => {
        if (selectedWinnerId) return rankedProposals.find(p => p.id === selectedWinnerId) || null;
        return null;
    }, [rankedProposals, selectedWinnerId]);

    const economicity = useMemo(() => {
        if (rankedProposals.length < 2) return null;
        const highest = rankedProposals[rankedProposals.length - 1].calculatedTotal;
        const lowest = rankedProposals[0].calculatedTotal;
        if (highest === 0) return null;
        const diff = highest - lowest;
        const percent = (diff / highest) * 100;
        return { diff, percent };
    }, [rankedProposals]);

    const potentialMixedTotal = useMemo(() => {
        return demand.items.reduce((acc, item) => {
            const lowestPrice = rankedProposals.reduce((min, p) => {
                const pItem = p.items.find((pi) => (pi.itemId || (pi as any).item_id) === item.id);
                if (!pItem || pItem.isDeclined) return min;
                return (min === null || pItem.unitPrice < min) ? pItem.unitPrice : min;
            }, null as number | null);
            return acc + (lowestPrice ? lowestPrice * item.quantity : 0);
        }, 0);
    }, [demand.items, rankedProposals]);



    // Geração automática de justificativa para o Modo Item/Misto
    useEffect(() => {
        if (judgmentMode === 'item') {
            const winners = Object.values(itemWinners) as ItemWinner[];
            if (winners.length > 0) {
                const totalItems = winners.length;
                const uniqueSuppliers = new Set(winners.map(w => w.supplierName)).size;
                const totalValue = winners.reduce((acc, curr) => acc + curr.totalValue, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                setJustification(`Homologação realizada por item, adjudicando ${totalItems} item(ns) para ${uniqueSuppliers} fornecedor(es) distinto(s), totalizando ${totalValue}. A seleção priorizou o menor preço unitário por item, conforme critérios de economicidade.`);
            } else {
                setJustification('');
            }
        }
    }, [itemWinners, judgmentMode]);

    const handleFinalConfirm = async () => {
        if (!justification.trim()) {
            warning("É obrigatório preencher a justificativa técnica para a homologação.");
            return;
        }

        let winnerObject: any = null;

        if (judgmentMode === 'global') {
            if (!selectedWinner) return;
            winnerObject = {
                mode: 'global',
                supplierName: selectedWinner.supplierName,
                totalValue: selectedWinner.calculatedTotal,
                justification
            };
        } else {
            // Item Mode
            const itemIds = Object.keys(itemWinners);
            if (itemIds.length === 0) return;

            const winnersValues = Object.values(itemWinners) as ItemWinner[];

            winnerObject = {
                mode: 'item',
                justification,
                totalValue: winnersValues.reduce((acc, curr) => acc + curr.totalValue, 0),
                items: Object.entries(itemWinners).map(([itemId, w]) => ({
                    itemId: Number(itemId),
                    supplierName: (w as ItemWinner).supplierName,
                    unitPrice: (w as ItemWinner).unitPrice,
                    quantity: (w as ItemWinner).quantity,
                    totalValue: (w as ItemWinner).totalValue
                }))
            };
        }

        setIsProcessing(true);
        try {
            await onDefineWinner(demand.id, winnerObject);
            setShowConfirmModal(false);
        } catch (error) {
            toastError("Erro ao registrar vencedor.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-down">
            {/* Header de Análise */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-xl backdrop-blur-md border border-blue-500/30">
                        <LockClosedIcon className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-black text-xl tracking-tight uppercase">Análise de Propostas (Sigilo Ativo)</h4>
                        <p className="text-blue-200 text-xs font-medium">Os proponentes são identificados por codinomes para garantir imparcialidade absoluta.</p>
                    </div>
                </div>
            </div>

            {/* Comparative Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">
                {/* Global Best Card */}
                {/* Global Best Card */}
                {(selectedWinner || rankedProposals[0]) && (
                    <div className={`bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group transition-all duration-300 ${judgmentMode === 'item' ? 'opacity-80 hover:opacity-100 scale-95 hover:scale-100' : ''}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><CheckCircleIcon className="w-32 h-32" /></div>
                        <div className="relative z-10">
                            <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                {selectedWinnerId ? 'Vencedor Global Selecionado' : 'Melhor Preço Global Individual'}
                            </span>
                            <h3 className="text-3xl font-black mt-4 mb-1 tracking-tighter">{(selectedWinner || rankedProposals[0]).alias}</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold">{(selectedWinner || rankedProposals[0]).calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            {economicity && economicity.diff > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-100 bg-blue-800/90 border border-blue-400/30 px-3 py-1.5 rounded-lg max-w-fit shadow-sm">
                                        <LightningBoltIcon className="w-3 h-3 text-emerald-400" />
                                        Economia: {economicity.diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({economicity.percent.toFixed(1)}%)
                                    </div>
                                    <p className="text-[10px] text-blue-100/80 font-medium leading-relaxed max-w-[280px]">
                                        Esta economia representa a diferença direta entre a proposta de menor valor e a maior oferta recebida, destacando o ganho na negociação.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mixed/Selected Best Card - Always Shown */}
                <div className={`bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group transition-all duration-300 ring-4 ring-emerald-200 flex flex-col justify-between ${judgmentMode === 'global' ? 'opacity-80 hover:opacity-100 scale-95 hover:scale-100' : ''}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><BoxIcon className="w-32 h-32" /></div>

                    {/* System Best Scenario */}
                    <div className="relative z-10 mb-6 border-b border-emerald-400/30 pb-4">
                        <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Potencial Máximo (Menor Preço)</span>
                        <div className="flex items-end gap-3 mt-2">
                            <span className="text-4xl font-black tracking-tighter">
                                {potentialMixedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <p className="text-emerald-100 text-[10px] font-bold mt-1">Menor valor possível combinando fornecedores automaticamente.</p>
                    </div>

                    {/* User Selection */}
                    <div className="relative z-10">
                        <h4 className="text-emerald-100 text-xs font-black uppercase tracking-wide mb-1">Sua Seleção Manual</h4>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    (Object.values(itemWinners) as ItemWinner[]).reduce((acc, w) => acc + w.totalValue, 0)
                                )}
                            </span>
                            <span className="text-emerald-200 text-xs font-bold bg-emerald-800/20 px-2 py-1 rounded">{Object.keys(itemWinners).length} itens</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selector de Modo de Julgamento (Segmented Control) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => {
                            setJudgmentMode('global');
                            setSelectedWinnerId(null);
                            setItemWinners({});
                            setJustification('');
                        }}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${judgmentMode === 'global' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                    >
                        <ChartBarIcon className="w-4 h-4" /> Julgamento por Menor Preço Global
                    </button>
                    <button
                        onClick={() => {
                            setJudgmentMode('item');
                            setSelectedWinnerId(null);
                            setItemWinners({});
                            setJustification('');
                        }}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${judgmentMode === 'item' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                    >
                        <BoxIcon className="w-4 h-4" /> Julgamento por Menor Preço por Item
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                    {judgmentMode === 'global' && (
                        <div className="space-y-6 animate-fade-in pb-8">
                            <div className="mb-6 flex items-center justify-between">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-blue-500" /> Quadro Comparativo Global</h4>
                                <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full italic">Organizado por menor valor global</span>
                            </div>

                            {rankedProposals.map((p, idx) => {
                                const isSelected = selectedWinnerId === p.id;
                                const isBest = idx === 0;

                                return (
                                    <div
                                        key={p.id}
                                        className={`group relative bg-white border-2 rounded-2xl transition-all duration-300 overflow-hidden shadow-sm
                                            ${isSelected
                                                ? 'border-blue-500 shadow-xl shadow-blue-500/10 ring-4 ring-blue-50'
                                                : isBest
                                                    ? 'border-emerald-500/30 bg-emerald-50/5'
                                                    : 'border-slate-100 hover:border-slate-300'}`}
                                    >
                                        {isBest && (
                                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm z-10">
                                                Melhor Valor
                                            </div>
                                        )}
                                        {/* Header do Proponente */}
                                        <div className="px-6 py-4 flex items-center gap-6">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${isBest ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {idx + 1}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-black text-slate-900 uppercase tracking-tight">{p.alias}</h5>
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">{p.items?.length || 0} itens cotados</span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium mt-0.5">
                                                    Prazo: {formatDeliveryTime(p.deliveryTime, p.submittedAt, demand.deadline)}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`text-xl font-black ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>
                                                    {p.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                                {p.historicalTotal > 0 && p.calculatedTotal <= p.historicalTotal && (
                                                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                                                        ✓ Abaixo do Histórico
                                                    </div>
                                                )}
                                            </div>

                                            <div className="h-10 w-px bg-slate-100 mx-2"></div>

                                            <button
                                                onClick={() => {
                                                    setSelectedWinnerId(p.id);
                                                    setJustification(`Declaramos vencedora a empresa detentora da proposta de menor valor global (${p.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}), atendendo a todos os requisitos técnicos e prazos estipulados no edital.`);
                                                }}
                                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                                                    : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50'}`}
                                            >
                                                {isSelected && <CheckCircleIcon className="w-5 h-5 text-white" />}
                                            </button>
                                        </div>

                                        {/* Composição Detalhada (Lista de Itens) */}
                                        <div className="bg-slate-50 border-t border-slate-100 p-4">
                                            <div className="flex items-center justify-between mb-4 px-2">
                                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo dos Itens</h6>
                                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Valores Unitários</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {demand.items.map((item, itemIdx) => {
                                                    const pItem = p.items.find((pi: any) => (pi.itemId || pi.item_id) === item.id);
                                                    const isDeclined = !pItem || pItem.isDeclined;

                                                    return (
                                                        <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-blue-200">
                                                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                                <ItemBadge index={itemIdx} />
                                                                <p className={`text-[11px] font-bold truncate ${isDeclined ? 'text-slate-300 italic' : 'text-slate-700'}`} title={item.description}>
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                            <p className={`text-[11px] font-black shrink-0 ${isDeclined ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                {isDeclined ? '---' : pItem.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {judgmentMode === 'item' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="mb-6 flex items-center justify-between">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2"><BoxIcon className="w-5 h-5 text-blue-500" /> Quadro Comparativo por Item</h4>
                                <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Selecione o vencedor de cada item</span>
                            </div>

                            {demand.items.map((item, idx) => (
                                <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-bold text-slate-700 text-sm">Item {idx + 1}: {item.description} ({item.quantity} {item.unit})</h5>
                                            <PriceHistoryPopover
                                                description={item.description}
                                                catalogItemId={item.catalog_item_id}
                                                demands={allDemands}
                                            />
                                        </div>
                                        {judgmentMode === 'item' && itemWinners[item.id] && (
                                            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-lg">
                                                Vencedor: {itemWinners[item.id].alias || itemWinners[item.id].supplierName}
                                            </span>
                                        )}
                                    </div>
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proponente</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Entrega</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Unitário</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Vlr. Ref. (Hist.)</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Item</th>
                                                {judgmentMode === 'item' && <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleção</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {rankedProposals.map(p => {
                                                const pItem = p.items.find((pi: any) => (pi.itemId || pi.item_id) === item.id);
                                                if (!pItem) return null;
                                                const isDeclined = pItem.isDeclined || false;
                                                // Robust check: ensures itemWinners entry exists AND IDs match
                                                const isSelected = !!itemWinners[item.id] && itemWinners[item.id].supplierId === p.supplierId;
                                                const isLowest = !isDeclined && rankedProposals.every(otherP => {
                                                    const otherItem = otherP.items.find((pi: any) => (pi.itemId || pi.item_id) === item.id);
                                                    return !otherItem || otherItem.isDeclined || otherItem.unitPrice >= pItem.unitPrice;
                                                });

                                                const itemHistory = getPriceHistory(item.description, item.catalog_item_id, allDemands);
                                                const lastPrice = itemHistory.length > 0 ? itemHistory[0].unitPrice : null;

                                                return (
                                                    <tr key={p.id} className={`${isSelected ? 'bg-green-50/80 border-l-4 border-l-green-500' : isDeclined ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/50'}`}>
                                                        <td className="px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-2">
                                                            {p.alias}
                                                            {isLowest && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Menor Preço neste Item"></span>}
                                                            {isDeclined && <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black">Declinado</span>}
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-slate-500 uppercase">{isDeclined ? '-' : pItem.brand || '-'}</td>
                                                        <td className="px-4 py-2 text-[10px] text-slate-600 font-medium">
                                                            {isDeclined ? '-' : formatDeliveryTime(p.deliveryTime, p.submittedAt, demand.deadline)}
                                                        </td>
                                                        <td className={`px-4 py-2 text-right text-xs font-medium ${isLowest ? 'text-green-600 font-bold' : isDeclined ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            {isDeclined ? '-' : pItem.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-xs font-bold text-blue-600 bg-blue-50/30">
                                                            {lastPrice ? (
                                                                <button
                                                                    onClick={() => setHistoryItem({ name: item.description, catalogItemId: item.catalog_item_id })}
                                                                    className="hover:underline flex items-center gap-1 justify-end ml-auto"
                                                                >
                                                                    {lastPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                    <ClockIcon className="w-2.5 h-2.5 opacity-50" />
                                                                </button>
                                                            ) : '-'}
                                                        </td>
                                                        <td className={`px-4 py-2 text-right text-xs font-bold ${isDeclined ? 'text-slate-400' : 'text-slate-800'}`}>
                                                            {isDeclined ? '-' : (pItem.unitPrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        {judgmentMode === 'item' && (
                                                            <td className="px-4 py-2 text-center">
                                                                <button
                                                                    disabled={isDeclined}
                                                                    onClick={() => {
                                                                        const newItemWinners = {
                                                                            ...itemWinners, [item.id]: {
                                                                                supplierId: p.supplierId,
                                                                                supplierName: p.supplierName,
                                                                                alias: p.alias,
                                                                                unitPrice: pItem.unitPrice,
                                                                                quantity: item.quantity,
                                                                                totalValue: pItem.unitPrice * item.quantity
                                                                            }
                                                                        };
                                                                        setItemWinners(newItemWinners);
                                                                    }}
                                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDeclined ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-300' : isSelected ? 'bg-green-500 border-green-500 text-white shadow-lg scale-110' : 'border-slate-300 bg-white hover:border-green-400 hover:bg-green-50'}`}
                                                                >
                                                                    {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total Item Selection Summary */
                    judgmentMode === 'item' && Object.keys(itemWinners).length > 0 && (
                        <div className="mx-6 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between mb-8 animate-fade-in-down">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 border border-emerald-200">
                                    <DollarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-emerald-800 uppercase tracking-tight text-lg leading-none mb-1">Total da Seleção Mista</h4>
                                    <p className="text-emerald-700 font-medium text-xs">Custo total combinando os melhores fornecedores por item.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-emerald-600 tracking-tighter">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        (Object.values(itemWinners) as ItemWinner[]).reduce((acc, w) => acc + w.totalValue, 0)
                                    )}
                                </div>
                                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded inline-block mt-1 uppercase tracking-widest">{Object.keys(itemWinners).length} itens selecionados</div>
                            </div>
                        </div>
                    )}

                {/* Justificativa Inline */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ClipboardListIcon className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-slate-800 text-sm">Justificativa de Homologação</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <textarea
                                value={justification}
                                onChange={e => setJustification(e.target.value)}
                                className="w-full rounded-2xl border-slate-300 p-4 text-sm focus:ring-blue-500 focus:border-blue-500 min-h-[120px] shadow-sm"
                                placeholder={judgmentMode === 'global'
                                    ? "Selecione um vencedor acima para gerar uma sugestão automática ou escreva manualmente..."
                                    : "Selecione os vencedores de cada item para homologar. A justificativa será gerada com o resumo dos itens."}
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="bg-blue-100/50 p-4 rounded-xl text-xs text-blue-800 border border-blue-200">
                                <p className="font-bold mb-1">Dica:</p>
                                <p>A justificativa deve mencionar os critérios de seleção (menor preço, prazo, ou técnica) e confirmar o atendimento aos requisitos do edital.</p>
                            </div>
                            <button
                                onClick={() => setShowConfirmModal(true)}
                                disabled={rankedProposals.length === 0 || isProcessing || (judgmentMode === 'global' ? !selectedWinnerId : Object.keys(itemWinners).length === 0)}
                                className="w-full bg-blue-600 text-white font-black px-4 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                            >
                                {isProcessing ? 'Gravando...' : 'Homologar Resultado'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Detalhamento de Itens por Proponente */}
            {viewingProposalItems && (
                <Modal isOpen={true} onClose={() => setViewingProposalItems(null)} title={`Dossiê de Preços: ${viewingProposalItems.alias}`}>
                    <div className="space-y-6">
                        <div className="bg-slate-900 p-6 rounded-2xl text-white flex justify-between items-center shadow-lg">
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Global da Oferta</p>
                                <p className="text-3xl font-black">{viewingProposalItems.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Informado</p>
                                <p className="text-base font-bold">{formatDeliveryTime(viewingProposalItems.deliveryTime, viewingProposalItems.submittedAt, demand.deadline)}</p>
                            </div>
                        </div>

                        <div className="overflow-hidden border border-slate-100 rounded-xl">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Item / Descrição</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Marca / Ref</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Qtd</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Unitário</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Vlr Ref. (Hist)</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {demand.items.map(dItem => {
                                        const pItem = viewingProposalItems.items.find((pi: any) => (pi.itemId || pi.item_id) === dItem.id);
                                        const isDeclined = pItem?.isDeclined || false;
                                        const unitPrice = pItem?.unitPrice || 0;
                                        const subtotal = dItem.quantity * unitPrice;

                                        const itemHistory = getPriceHistory(dItem.description, dItem.catalog_item_id, allDemands);
                                        const lastPrice = itemHistory.length > 0 ? itemHistory[0].unitPrice : null;

                                        return (
                                            <tr key={dItem.id} className={`hover:bg-slate-50/50 ${isDeclined ? 'bg-slate-50/80 opacity-70' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <p className={`text-sm font-bold ${isDeclined ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{dItem.description}</p>
                                                            <p className="text-[10px] text-slate-400 uppercase">{dItem.unit}</p>
                                                        </div>
                                                        {!isDeclined && (
                                                            <PriceHistoryPopover
                                                                description={dItem.description}
                                                                catalogItemId={dItem.catalog_item_id}
                                                                demands={allDemands}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${isDeclined ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                                        {isDeclined ? 'ITEM DECLINADO' : pItem?.brand || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-right text-sm font-medium ${isDeclined ? 'text-slate-400' : 'text-slate-500'}`}>{dItem.quantity}</td>
                                                <td className={`px-6 py-4 text-right text-sm font-bold ${isDeclined ? 'text-slate-400' : 'text-slate-700'}`}>
                                                    {isDeclined ? '-' : unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {lastPrice ? (
                                                        <button
                                                            onClick={() => setHistoryItem({ name: dItem.description, catalogItemId: dItem.catalog_item_id })}
                                                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 justify-end ml-auto"
                                                        >
                                                            {lastPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                            <ClockIcon className="w-3 h-3 opacity-50" />
                                                        </button>
                                                    ) : <span className="text-xs text-slate-300">-</span>}
                                                </td>
                                                <td className={`px-6 py-4 text-right text-sm font-black ${isDeclined ? 'text-slate-400' : 'text-slate-900'}`}>
                                                    {isDeclined ? '-' : subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {viewingProposalItems.observations && !viewingProposalItems.observations.includes('DECLINED') && (
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                <p className="text-[10px] font-black text-amber-700 uppercase mb-1">Observações do Proponente:</p>
                                <p className="text-sm text-amber-800 italic">"{viewingProposalItems.observations}"</p>
                            </div>
                        )}

                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => setViewingProposalItems(null)}
                                className="px-10 py-3 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all shadow-lg"
                            >
                                Fechar Detalhamento
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de Confirmação de Homologação */}
            {showConfirmModal && (
                <Modal isOpen={true} onClose={() => setShowConfirmModal(false)} title="Confirmar Homologação">
                    <div className="space-y-6">
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200">
                            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><LockClosedIcon className="w-5 h-5" /> Atenção: Esta ação é definitiva</h4>
                            <p className="text-sm text-amber-700">Ao homologar, o sigilo das propostas será quebrado. O nome real da empresa será revelado e os outros fornecedores serão notificados do resultado.</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                            {judgmentMode === 'global' ? (
                                <>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Codinome:</span> <span className="font-bold">{selectedWinner?.alias}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Valor Final:</span> <span className="font-bold text-blue-700">{Number(selectedWinner?.calculatedTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Modalidade:</span> <span className="font-bold">Menor Preço por Item</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Itens Adjudicados:</span> <span className="font-bold">{Object.keys(itemWinners).length} de {demand.items.length}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Valor Total Acumulado:</span> <span className="font-bold text-blue-700">{Number(Object.values(itemWinners).reduce((acc: number, curr: any) => acc + curr.totalValue, 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                </>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setShowConfirmModal(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Voltar</button>
                            <button onClick={handleFinalConfirm} disabled={isProcessing} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transform active:scale-95 transition-all uppercase tracking-widest">
                                {isProcessing ? 'Gravando...' : 'Confirmar e Revelar'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            {historyItem && (
                <PriceHistoryModal
                    isOpen={true}
                    onClose={() => setHistoryItem(null)}
                    description={historyItem.name}
                    catalogItemId={historyItem.catalogItemId}
                    demands={allDemands}
                    onNavigateToDemand={onNavigateToDemand}
                />
            )}
        </div>
    );
};

export default ProposalAnalysis;
