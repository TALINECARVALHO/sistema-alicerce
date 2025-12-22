
import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo, useEffect } from 'react';
import { Demand, Proposal, Item } from '../types';
import { CheckCircleIcon, DollarIcon, ClockIcon, UsersIcon, ChartBarIcon, ClipboardListIcon, LockClosedIcon, LightningBoltIcon, BoxIcon, SearchIcon } from './icons';
import Modal from './Modal';

interface ProposalAnalysisProps {
    demand: Demand;
    onDefineWinner: (demandId: number, winner: any) => Promise<void>;
}



interface ItemWinner {
    supplierId: number;
    supplierName: string;
    unitPrice: number;
    quantity: number;
    totalValue: number;
}

const ProposalAnalysis: React.FC<ProposalAnalysisProps> = ({ demand, onDefineWinner }) => {
    const { error: toastError, warning } = useToast();
    const [justification, setJustification] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
    const [judgmentMode, setJudgmentMode] = useState<'global' | 'item'>('global');
    const [itemWinners, setItemWinners] = useState<Record<number, ItemWinner>>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [viewingProposalItems, setViewingProposalItems] = useState<any | null>(null);

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
            const calculatedTotal = p.totalValue || p.items.reduce((acc, pItem) => {
                const idToFind = pItem.itemId || (pItem as any).item_id;
                const demandItem = demand.items.find(dItem => dItem.id === idToFind);
                return acc + (demandItem ? demandItem.quantity * pItem.unitPrice : 0);
            }, 0);

            return {
                ...p,
                alias: `Proponente ${String(index + 1).padStart(2, '0')}`,
                calculatedTotal: calculatedTotal
            };
        });
    }, [demand.proposals, demand.items]);

    const rankedProposals = useMemo(() =>
        [...anonymizedProposals].sort((a, b) => a.calculatedTotal - b.calculatedTotal)
        , [anonymizedProposals]);

    const selectedWinner = useMemo(() => {
        if (selectedWinnerId) return rankedProposals.find(p => p.id === selectedWinnerId) || null;
        return rankedProposals.length > 0 ? rankedProposals[0] : null;
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

    useEffect(() => {
        if (rankedProposals.length > 0 && !selectedWinnerId) {
            setSelectedWinnerId(rankedProposals[0].id);
        }
    }, [rankedProposals, selectedWinnerId]);

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

            {/* Card de Melhor Proposta (Destaque) */}
            {selectedWinner && (
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><CheckCircleIcon className="w-32 h-32" /></div>
                    <div className="relative z-10">
                        <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Melhor Proposta Atual</span>
                        <h3 className="text-5xl font-black mt-4 mb-2 tracking-tighter">{selectedWinner.alias}</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-bold">{selectedWinner.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span className="text-blue-200 text-sm mb-1.5 font-medium">Prazo: {selectedWinner.deliveryTime}</span>
                        </div>

                        {economicity && economicity.diff > 0 && (
                            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-4 py-2 rounded-xl backdrop-blur-sm">
                                <LightningBoltIcon className="w-4 h-4 text-emerald-300" />
                                <span className="text-xs font-bold text-emerald-50 uppercase">Economia Gerada: {economicity.diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({economicity.percent.toFixed(1)}%)</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                        <div className="overflow-x-auto animate-fade-in">
                            <div className="mb-6 flex items-center justify-between">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-blue-500" /> Quadro Comparativo Global</h4>
                                <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Selecione o vencedor abaixo</span>
                            </div>

                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                                        <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                                        <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Entrega</th>
                                        <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens</th>
                                        <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</th>
                                        <th className="text-center py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rankedProposals.length > 0 && rankedProposals.map((p, idx) => {
                                        const isFaster = demand.deadline && p.deliveryTime && new Date(p.deliveryTime) < new Date(demand.deadline);
                                        return (
                                            <tr key={p.id} className={`group hover:bg-slate-50/80 transition-colors ${selectedWinnerId === p.id ? 'bg-blue-50/50' : ''}`}>
                                                <td className="py-4">
                                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="py-4 font-bold text-slate-800">{p.alias}</td>
                                                <td className="py-4 text-sm text-slate-600 font-medium">
                                                    <div className="flex items-center gap-1">
                                                        {p.deliveryTime}
                                                        {demand.deadline && p.deliveryTime && p.deliveryTime < demand.deadline && (
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Ágil</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 text-xs text-slate-500 font-bold">{p.items?.length || 0} cotados</td>
                                                <td className="py-4 text-right font-black text-slate-900">{p.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => setViewingProposalItems(p)}
                                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1"
                                                        >
                                                            <SearchIcon className="w-3 h-3" /> Detalhar
                                                        </button>
                                                        {judgmentMode === 'global' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedWinnerId(p.id);
                                                                    setJustification(`Declaramos vencedora a empresa detentora da proposta de menor valor global (${p.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}), atendendo a todos os requisitos técnicos e prazos estipulados no edital.`);
                                                                }}
                                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedWinnerId === p.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600'}`}
                                                            >
                                                                {selectedWinnerId === p.id ? 'Selecionado' : 'Escolher'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {rankedProposals.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 italic">Nenhuma proposta competitiva encontrada para esta demanda.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                                        <h5 className="font-bold text-slate-700 text-sm">Item {idx + 1}: {item.description} ({item.quantity} {item.unit})</h5>
                                        {judgmentMode === 'item' && itemWinners[item.id] && (
                                            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-lg">
                                                Vencedor: {itemWinners[item.id].supplierName}
                                            </span>
                                        )}
                                    </div>
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Proponente</th>
                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Marca</th>
                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase">Unitário</th>
                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase">Total Item</th>
                                                {judgmentMode === 'item' && <th className="px-4 py-2 text-center text-[10px] font-black text-slate-400 uppercase">Seleção</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {rankedProposals.map(p => {
                                                const pItem = p.items.find((pi: any) => (pi.itemId || pi.item_id) === item.id);
                                                if (!pItem) return null;
                                                const isSelected = itemWinners[item.id]?.supplierId === p.supplierId;
                                                const isLowest = rankedProposals.every(otherP => {
                                                    const otherItem = otherP.items.find((pi: any) => (pi.itemId || pi.item_id) === item.id);
                                                    return !otherItem || otherItem.unitPrice >= pItem.unitPrice;
                                                });

                                                return (
                                                    <tr key={p.id} className={`${isSelected ? 'bg-green-50' : 'hover:bg-slate-50/50'}`}>
                                                        <td className="px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-2">
                                                            {p.alias}
                                                            {isLowest && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Menor Preço neste Item"></span>}
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-slate-500">{pItem.brand || '-'}</td>
                                                        <td className={`px-4 py-2 text-right text-xs font-medium ${isLowest ? 'text-green-600 font-bold' : 'text-slate-600'}`}>{pItem.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                        <td className="px-4 py-2 text-right text-xs font-bold text-slate-800">{(pItem.unitPrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                        {judgmentMode === 'item' && (
                                                            <td className="px-4 py-2 text-center">
                                                                <button
                                                                    onClick={() => {
                                                                        const newItemWinners = {
                                                                            ...itemWinners, [item.id]: {
                                                                                supplierId: p.supplierId,
                                                                                supplierName: p.supplierName,
                                                                                unitPrice: pItem.unitPrice,
                                                                                quantity: item.quantity,
                                                                                totalValue: pItem.unitPrice * item.quantity
                                                                            }
                                                                        };
                                                                        setItemWinners(newItemWinners);
                                                                    }}
                                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hovered:border-green-400'}`}
                                                                >
                                                                    {isSelected && <span className="text-[8px] font-bold">✓</span>}
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
                                <p className="text-base font-bold">{viewingProposalItems.deliveryTime}</p>
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
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {demand.items.map(dItem => {
                                        const pItem = viewingProposalItems.items.find((pi: any) => (pi.itemId || pi.item_id) === dItem.id);
                                        const unitPrice = pItem?.unitPrice || 0;
                                        const subtotal = dItem.quantity * unitPrice;

                                        return (
                                            <tr key={dItem.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-800">{dItem.description}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase">{dItem.unit}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                        {pItem?.brand || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium text-slate-500">{dItem.quantity}</td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-slate-700">{unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
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
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Valor Final:</span> <span className="font-bold text-blue-700">{selectedWinner?.calculatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Modalidade:</span> <span className="font-bold">Menor Preço por Item</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Itens Adjudicados:</span> <span className="font-bold">{Object.keys(itemWinners).length} de {demand.items.length}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Valor Total Acumulado:</span> <span className="font-bold text-blue-700">{Object.values(itemWinners).reduce((acc, curr: any) => acc + curr.totalValue, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
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
        </div>
    );
};

export default ProposalAnalysis;
