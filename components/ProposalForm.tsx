import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo, useEffect } from 'react';
import { Demand, Proposal, ProposalItem, Supplier } from '../types';
import { ClockIcon, TagIcon } from './icons';

interface ProposalFormProps {
    demand: Demand;
    onSubmit: (demandId: number, proposal: Proposal) => Promise<void> | void;
    currentSupplier?: Supplier;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ demand, onSubmit, currentSupplier }) => {
    const { error: toastError, warning } = useToast();
    const [items, setItems] = useState<ProposalItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ensure items are initialized when demand changes
    useEffect(() => {
        if (demand && demand.items) {
            setItems(demand.items.map(item => ({ itemId: item.id, unitPrice: 0, brand: '' })));
        }
    }, [demand]);

    const [observations, setObservations] = useState('');

    // Deadline Logic State
    const [useCustomDeadline, setUseCustomDeadline] = useState(false);
    const [customDays, setCustomDays] = useState<string>('');

    // Calculate days remaining/allowed
    const { maxDeadlineDate, maxDays } = useMemo(() => {
        const deadline = new Date(demand.deadline);
        const today = new Date();
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            maxDeadlineDate: deadline.toLocaleDateString('pt-BR'),
            maxDays: diffDays > 0 ? diffDays : 0
        };
    }, [demand.deadline]);

    const handlePriceChange = (itemId: number, price: number) => {
        setItems(prevItems =>
            prevItems.map(item => (item.itemId === itemId ? { ...item, unitPrice: price } : item))
        );
    };

    const handleBrandChange = (itemId: number, brand: string) => {
        setItems(prevItems =>
            prevItems.map(item => (item.itemId === itemId ? { ...item, brand } : item))
        );
    };

    const calculateGrandTotal = () => {
        return items.reduce((acc, pItem) => {
            const demandItem = demand.items.find(i => i.id === pItem.itemId);
            return acc + (demandItem ? demandItem.quantity * pItem.unitPrice : 0);
        }, 0);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSupplier) {
            toastError('Erro: Fornecedor não identificado. Não é possível enviar a proposta.');
            return;
        }

        // Validate that at least one item has a price
        const hasValue = items.some(i => i.unitPrice > 0);
        if (!hasValue) {
            warning("A proposta deve ter pelo menos um item com valor maior que R$ 0,00.");
            return;
        }

        // Validate Deadline
        let deliveryTimeFinal = `Conforme Edital (até ${maxDeadlineDate})`;
        if (useCustomDeadline) {
            if (!customDays || parseInt(customDays) <= 0) {
                warning("Por favor, informe um número de dias válido.");
                return;
            }
            if (parseInt(customDays) >= maxDays) {
                warning(`O prazo personalizado deve ser MENOR que o prazo do edital (${maxDays} dias).`);
                return;
            }
            deliveryTimeFinal = `${customDays} dias (Antecipado)`;
        }

        setIsSubmitting(true);

        const newProposal: Proposal = {
            id: Date.now(),
            protocol: `PROP-${String(Date.now()).slice(-4)}`,
            supplierId: currentSupplier.id,
            supplierName: currentSupplier.name,
            deliveryTime: deliveryTimeFinal,
            items,
            submittedAt: new Date().toISOString(),
            totalValue: calculateGrandTotal(),
            observations: observations.trim() ? observations : undefined,
        };

        try {
            await onSubmit(demand.id, newProposal);
            // Sucesso: o componente pai atualizará o estado e esconderá este form.
            setIsSubmitting(false);
        } catch (e) {
            console.error("Error submitting proposal:", e);
            setIsSubmitting(false);
        }
    };

    const calculateTotal = (itemId: number, unitPrice: number) => {
        const item = demand.items.find(i => i.id === itemId);
        return item ? item.quantity * unitPrice : 0;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Nova Proposta Comercial</h3>
            </div>

            {/* 1. Items Section (Priority) */}
            <div>
                {/* Header Row (Hidden on mobile) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-5">Descrição / Quantidade</div>
                    <div className="col-span-3">Marca / Fabricante</div>
                    <div className="col-span-2">Preço Unit. (R$)</div>
                    <div className="col-span-2 text-right">Total Item</div>
                </div>

                <div className="space-y-3">
                    {demand.items.map(item => {
                        const proposalItem = items.find(pi => pi.itemId === item.id);
                        const currentPrice = proposalItem ? proposalItem.unitPrice : 0;
                        const currentBrand = proposalItem ? proposalItem.brand : '';

                        return (
                            <div key={item.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:border-blue-300 transition-colors">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    {/* Description & Qty */}
                                    <div className="md:col-span-5">
                                        <p className="font-bold text-slate-900 text-base">{item.description}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Qtd: <span className="text-slate-900">{item.quantity} {item.unit}</span></p>
                                    </div>

                                    {/* Brand Input */}
                                    <div className="md:col-span-3">
                                        <label className="md:hidden block text-xs font-bold text-slate-600 uppercase mb-1">Marca</label>
                                        <input
                                            type="text"
                                            value={currentBrand}
                                            onChange={e => handleBrandChange(item.id, e.target.value)}
                                            className="w-full rounded-md border-slate-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="Ex: Tigre..."
                                        />
                                    </div>

                                    {/* Price Input */}
                                    <div className="md:col-span-2">
                                        <label className="md:hidden block text-xs font-bold text-slate-600 uppercase mb-1">Preço (R$)</label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-2 text-slate-400 text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={currentPrice}
                                                onChange={e => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                                                className="w-full rounded-md border-slate-300 shadow-sm pl-8 pr-2 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Total Item */}
                                    <div className="md:col-span-2 flex justify-between md:justify-end items-center border-t md:border-t-0 border-slate-200 mt-2 pt-2 md:mt-0 md:pt-0">
                                        <span className="md:hidden text-xs font-bold text-slate-500 uppercase">Total</span>
                                        <span className="font-bold text-slate-900 text-sm">{calculateTotal(item.id, currentPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Global Total moved here */}
                <div className="mt-4 flex justify-end">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Valor Global da Proposta</p>
                        <p className="text-3xl font-black text-slate-800">{calculateGrandTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* 2. Deadline Section */}
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 h-fit">
                    <h4 className="text-md font-bold text-blue-800 mb-3 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5" /> Prazo de Entrega / Execução
                    </h4>

                    <div className="space-y-3">
                        <div className="flex items-center p-3 bg-white rounded border border-blue-200">
                            <input
                                type="radio"
                                name="deadlineType"
                                checked={!useCustomDeadline}
                                onChange={() => setUseCustomDeadline(false)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <label className="ml-3 block text-sm font-medium text-slate-700">
                                Aceito o prazo do edital <span className="text-slate-500 font-normal">(até {maxDeadlineDate})</span>
                            </label>
                        </div>

                        <div className="flex flex-col p-3 bg-white rounded border border-blue-200 transition-all">
                            <div className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    name="deadlineType"
                                    checked={useCustomDeadline}
                                    onChange={() => setUseCustomDeadline(true)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <label className="ml-3 block text-sm font-medium text-slate-700">
                                    Posso entregar em prazo menor
                                </label>
                            </div>

                            {useCustomDeadline && (
                                <div className="ml-7 animate-fade-in-down">
                                    <label className="block text-xs text-slate-500 mb-1">Informe em quantos dias úteis:</label>
                                    <input
                                        type="number"
                                        value={customDays}
                                        onChange={e => setCustomDays(e.target.value)}
                                        max={maxDays - 1}
                                        min="1"
                                        className="w-32 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-1.5 text-sm"
                                        placeholder={`< ${maxDays}`}
                                    />
                                    <p className="text-xs text-blue-600 mt-1">Deve ser menor que {maxDays} dias.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Observations Section */}
                <div>
                    <h4 className="text-md font-bold text-slate-700 mb-3">Observações Gerais</h4>
                    <textarea
                        id="observations"
                        value={observations}
                        onChange={e => setObservations(e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm"
                        rows={6}
                        placeholder="Insira aqui informações sobre validade da proposta, detalhes técnicos adicionais ou condições especiais..."
                    />
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-10 py-4 bg-green-600 text-white font-black text-xl rounded-xl shadow-xl hover:bg-green-700 transition-all transform flex items-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enviando...
                        </>
                    ) : 'Confirmar e Enviar'}
                </button>
            </div>
        </form >
    );
};

export default ProposalForm;
