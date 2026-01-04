import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo, useEffect } from 'react';
import { Demand, Proposal, ProposalItem, Supplier, Group } from '../types';
import { ClockIcon, TagIcon } from './icons';

interface ProposalFormProps {
    demand: Demand;
    onSubmit: (demandId: number, proposal: Proposal) => Promise<void> | void;
    currentSupplier?: Supplier;
    groups: Group[];
}

const ProposalForm: React.FC<ProposalFormProps> = ({ demand, onSubmit, currentSupplier, groups }) => {
    const { error: toastError, warning } = useToast();
    const [items, setItems] = useState<ProposalItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Acknowledgment checkboxes
    const [acknowledgeDelivery, setAcknowledgeDelivery] = useState(false);
    const [acknowledgeSanctions, setAcknowledgeSanctions] = useState(false);

    // Filter items based on supplier's registered groups
    const filteredItems = useMemo(() => {
        if (!currentSupplier || !groups) return demand.items || [];

        // Get IDs of groups the supplier is registered for
        const supplierGroupIds = groups
            .filter(g => (currentSupplier.groups || []).includes(g.name))
            .map(g => g.id);

        return (demand.items || []).filter(item => supplierGroupIds.includes(item.group_id));
    }, [demand.items, currentSupplier, groups]);

    // Ensure items are initialized when filteredItems changes
    useEffect(() => {
        if (filteredItems) {
            setItems(filteredItems.map(item => ({ itemId: item.id, unitPrice: 0, brand: '' })));
        }
    }, [filteredItems]);

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

    const handleToggleDecline = (itemId: number) => {
        setItems(prevItems =>
            prevItems.map(item => {
                if (item.itemId === itemId) {
                    const isNowDeclined = !item.isDeclined;
                    return {
                        ...item,
                        isDeclined: isNowDeclined,
                        unitPrice: isNowDeclined ? 0 : item.unitPrice,
                        brand: isNowDeclined ? '' : item.brand
                    };
                }
                return item;
            })
        );
    };

    const calculateGrandTotal = () => {
        return items.reduce((acc, pItem) => {
            if (pItem.isDeclined) return acc;
            const demandItem = filteredItems.find(i => i.id === pItem.itemId);
            return acc + (demandItem ? demandItem.quantity * pItem.unitPrice : 0);
        }, 0);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSupplier) {
            toastError('Erro: Fornecedor não identificado. Não é possível enviar a proposta.');
            return;
        }

        // Validate that at least one item is NOT declined and has a price
        const hasValidItem = items.some(i => !i.isDeclined && i.unitPrice > 0);
        if (!hasValidItem) {
            warning("A proposta deve ter pelo menos um item cotado (não declinado) com valor maior que R$ 0,00.");
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
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + parseInt(customDays));
            const formattedDate = deliveryDate.toLocaleDateString('pt-BR');
            deliveryTimeFinal = `${customDays} dias (Antecipado - ${formattedDate})`;
        }

        // Validate acknowledgment checkboxes
        if (!acknowledgeDelivery) {
            warning("Você deve confirmar que está ciente sobre a entrega/execução no local indicado.");
            return;
        }
        if (!acknowledgeSanctions) {
            warning("Você deve confirmar que está ciente sobre as sanções em caso de descumprimento.");
            return;
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
        const item = filteredItems.find(i => i.id === itemId);
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
                    <div className="col-span-4">Descrição / Quantidade</div>
                    <div className="col-span-3">Marca / Fabricante</div>
                    <div className="col-span-2">Preço Unit. (R$)</div>
                    <div className="col-span-1">EXCLUIR</div>
                    <div className="col-span-2 text-right">Total Item</div>
                </div>

                <div className="space-y-3">
                    {(!filteredItems || filteredItems.length === 0) && (
                        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                            <p className="font-bold">Nenhum item compatível com seus grupos de atuação encontrado.</p>
                            <p className="text-xs mt-2">ID da Demanda: {demand.id}</p>
                            <p className="text-xs">Seus grupos: {currentSupplier?.groups?.join(', ') || 'Nenhum'}</p>
                        </div>
                    )}
                    {filteredItems && filteredItems.map(item => {
                        const proposalItem = items.find(pi => pi.itemId === item.id);
                        const currentPrice = proposalItem ? proposalItem.unitPrice : 0;
                        const currentBrand = proposalItem ? proposalItem.brand : '';
                        const isDeclined = proposalItem?.isDeclined || false;

                        return (
                            <div key={item.id} className={`p-4 border rounded-lg transition-all ${isDeclined ? 'bg-slate-100 border-slate-300 opacity-75' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    {/* Description & Qty */}
                                    <div className="md:col-span-4">
                                        <p className={`font-bold text-base ${isDeclined ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{item.description}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Qtd: <span className={isDeclined ? 'text-slate-400' : 'text-slate-900'}>{item.quantity} {item.unit}</span></p>
                                    </div>

                                    {/* Brand Input */}
                                    <div className="md:col-span-3">
                                        <label className="md:hidden block text-xs font-bold text-slate-600 uppercase mb-1">Marca</label>
                                        <input
                                            type="text"
                                            value={currentBrand}
                                            onChange={e => handleBrandChange(item.id, e.target.value)}
                                            className={`w-full rounded-md border-slate-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 ${isDeclined ? 'bg-slate-200 cursor-not-allowed text-slate-500' : ''}`}
                                            placeholder={isDeclined ? "ITEM DECLINADO" : "Ex: Tigre..."}
                                            disabled={isDeclined}
                                        />
                                    </div>

                                    {/* Price Input */}
                                    <div className="md:col-span-2">
                                        <label className="md:hidden block text-xs font-bold text-slate-600 uppercase mb-1">Preço (R$)</label>
                                        <div className="relative">
                                            {!isDeclined && <span className="absolute left-2.5 top-2 text-slate-400 text-sm">R$</span>}
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={isDeclined ? '' : currentPrice}
                                                onChange={e => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                                                className={`w-full rounded-md border-slate-300 shadow-sm py-2 text-sm font-semibold focus:border-blue-500 focus:ring-blue-500 ${isDeclined ? 'bg-slate-200 cursor-not-allowed text-slate-400 pl-3' : 'pl-8 pr-2 text-slate-900'}`}
                                                required={!isDeclined}
                                                disabled={isDeclined}
                                                placeholder={isDeclined ? "-" : "0.00"}
                                            />
                                        </div>
                                    </div>

                                    {/* Decline Toggle */}
                                    <div className="md:col-span-1 flex flex-col items-center justify-center">
                                        <label className="md:hidden block text-xs font-bold text-slate-600 uppercase mb-1">Excluir</label>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleDecline(item.id)}
                                            className={`p-2 rounded-lg border transition-all ${isDeclined
                                                ? 'bg-red-100 border-red-300 text-red-600'
                                                : 'bg-white border-slate-300 text-slate-400 hover:text-red-500 hover:border-red-200'
                                                }`}
                                            title={isDeclined ? "Remover Declínio" : "Declinar este item"}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {isDeclined ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                )}
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Total Item */}
                                    <div className="md:col-span-2 flex justify-between md:justify-end items-center border-t md:border-t-0 border-slate-200 mt-2 pt-2 md:mt-0 md:pt-0">
                                        <span className="md:hidden text-xs font-bold text-slate-500 uppercase">Total</span>
                                        <span className={`font-bold text-sm ${isDeclined ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                            {isDeclined ? 'R$ 0,00' : calculateTotal(item.id, currentPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
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

            {/* Terms and Conditions Section */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 mb-4">
                    <div className="bg-amber-500 text-white rounded-full p-2 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-amber-900 mb-1">Termos e Condições Obrigatórios</h4>
                        <p className="text-sm text-amber-800">Leia atentamente e marque as declarações abaixo antes de enviar sua proposta.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Checkbox 1: Delivery/Execution Location */}
                    <div className={`flex items-start gap-3 p-4 bg-white rounded-lg border-2 transition-all ${acknowledgeDelivery ? 'border-green-300 bg-green-50' : 'border-amber-200'}`}>
                        <input
                            type="checkbox"
                            id="acknowledgeDelivery"
                            checked={acknowledgeDelivery}
                            onChange={(e) => setAcknowledgeDelivery(e.target.checked)}
                            className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="acknowledgeDelivery" className="flex-1 cursor-pointer">
                            <span className="block text-sm font-bold text-slate-800 mb-1">
                                ✓ Ciência sobre Local de Entrega/Execução
                            </span>
                            <span className="block text-xs text-slate-600 leading-relaxed">
                                Declaro estar ciente de que o preço proposto deve <strong>englobar todos os custos de entrega e/ou execução no local indicado pela secretaria solicitante</strong>: <span className="font-semibold text-blue-700">{demand.deliveryLocation}</span>. Não serão aceitos custos adicionais posteriores.
                            </span>
                        </label>
                    </div>

                    {/* Checkbox 2: Sanctions */}
                    <div className={`flex items-start gap-3 p-4 bg-white rounded-lg border-2 transition-all ${acknowledgeSanctions ? 'border-green-300 bg-green-50' : 'border-amber-200'}`}>
                        <input
                            type="checkbox"
                            id="acknowledgeSanctions"
                            checked={acknowledgeSanctions}
                            onChange={(e) => setAcknowledgeSanctions(e.target.checked)}
                            className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="acknowledgeSanctions" className="flex-1 cursor-pointer">
                            <span className="block text-sm font-bold text-slate-800 mb-1">
                                ✓ Ciência sobre Sanções por Descumprimento
                            </span>
                            <span className="block text-xs text-slate-600 leading-relaxed">
                                Declaro estar ciente de que, <strong>caso seja declarado vencedor e não cumpra com as obrigações assumidas</strong>, estarei sujeito às sanções administrativas previstas em lei, incluindo advertência, multa, suspensão temporária de participação em licitações e impedimento de contratar com o município.
                            </span>
                        </label>
                    </div>
                </div>

                {(!acknowledgeDelivery || !acknowledgeSanctions) && (
                    <div className="flex items-center gap-2 text-amber-800 text-xs bg-amber-100 px-4 py-2 rounded-lg border border-amber-300">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Você precisa marcar ambas as declarações para enviar a proposta.</span>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={isSubmitting || !acknowledgeDelivery || !acknowledgeSanctions}
                    className={`px-10 py-4 bg-green-600 text-white font-black text-xl rounded-xl shadow-xl transition-all transform flex items-center gap-3 ${isSubmitting || !acknowledgeDelivery || !acknowledgeSanctions
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-green-700 hover:scale-105 active:scale-95'
                        }`}
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
