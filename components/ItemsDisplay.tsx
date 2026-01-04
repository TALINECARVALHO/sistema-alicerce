import React, { useState } from 'react';
import { Item, Demand, DemandStatus, UserRole } from '../types';
import PriceHistoryPopover from './PriceHistoryPopover';
import * as api from '../services/api';

interface ItemsDisplayProps {
    items: Item[];
    demand: Demand;
    allDemands: Demand[];
    isCitizen?: boolean;
    hasWinner?: boolean;
    itemPriceMap?: Map<number, { unitPrice: number; deliveryTime: string }>;
    onNavigateToDemand?: (demandId: number) => void;
    compact?: boolean;
}

export const ItemBadge: React.FC<{ index: number }> = ({ index }) => (
    <span className="inline-flex items-center justify-center w-8 h-5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md border border-slate-200 mr-2">
        #{String(index + 1).padStart(2, '0')}
    </span>
);

const ItemsDisplay: React.FC<ItemsDisplayProps> = ({
    items,
    demand,
    allDemands,
    isCitizen = false,
    hasWinner = false,
    itemPriceMap,
    onNavigateToDemand,
    compact = false
}) => {
    // Determine if values should be hidden (Blind Phase)
    const isBlindPhase = [DemandStatus.AGUARDANDO_PROPOSTA, DemandStatus.EM_ANALISE].includes(demand.status);
    const showDetails = hasWinner || (!isCitizen && demand.proposals.length > 0 && !isBlindPhase);

    if (compact) {
        return (
            <div className="grid grid-cols-1 gap-2">
                {items.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <ItemBadge index={idx} />
                            {item.imagePath && (
                                <img
                                    src={api.getItemImageUrl(item.imagePath)}
                                    alt={item.description}
                                    className="w-8 h-8 object-cover rounded border border-slate-200"
                                />
                            )}
                            <div className="truncate">
                                <p className="text-xs font-bold text-slate-700 truncate" title={item.description}>{item.description}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-black">{item.quantity} {item.unit}</p>
                            </div>
                        </div>
                        {showDetails && itemPriceMap?.has(item.id) && (
                            <div className="text-right shrink-0 ml-4">
                                <p className="text-xs font-black text-emerald-600">
                                    {itemPriceMap.get(item.id)?.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                        <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd/Unid</th>
                        {showDetails && (
                            <>
                                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Unitário</th>
                                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => {
                        const priceInfo = itemPriceMap?.get(item.id);
                        const unitPrice = priceInfo?.unitPrice || 0;
                        const totalPrice = unitPrice * item.quantity;
                        const deliveryTime = priceInfo?.deliveryTime || '-';

                        return (
                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <ItemBadge index={idx} />
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                    <div className="flex items-center gap-3">
                                        {item.imagePath && (
                                            <img
                                                src={api.getItemImageUrl(item.imagePath)}
                                                alt={item.description}
                                                className="w-12 h-12 object-cover rounded border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => window.open(api.getItemImageUrl(item.imagePath!), '_blank')}
                                                title="Clique para ampliar"
                                            />
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="line-clamp-1" title={item.description}>{item.description}</span>
                                            {!isCitizen && (
                                                <PriceHistoryPopover
                                                    description={item.description}
                                                    catalogItemId={item.catalog_item_id}
                                                    demands={allDemands}
                                                    onNavigateToDemand={onNavigateToDemand}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 text-right font-bold uppercase">
                                    {item.quantity} {item.unit}
                                </td>
                                {showDetails && (
                                    <>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-black text-emerald-600 text-right">
                                            {unitPrice > 0 ? unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-black text-emerald-700 text-right">
                                            {totalPrice > 0 ? totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[10px] text-slate-500 font-bold uppercase">
                                            {deliveryTime}
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ItemsDisplay;
