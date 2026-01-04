
import React from 'react';
import { Demand } from '../types';
import { getPriceHistory } from '../utils/priceHistory';
import { ClockIcon, XIcon, DollarIcon, ExternalLinkIcon, TrendingUpIcon, ActivityIcon, CalendarIcon } from './icons';
import Modal from './Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    description: string;
    catalogItemId?: string | null;
    demands: Demand[];
    onNavigateToDemand?: (demandId: number) => void;
}

const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ isOpen, onClose, description, catalogItemId, demands, onNavigateToDemand }) => {
    const history = getPriceHistory(description, catalogItemId, demands);

    const lastValue = history.length > 0 ? history[0].unitPrice : null;
    const avgAll = history.length > 0 ? history.reduce((acc, curr) => acc + curr.unitPrice, 0) / history.length : null;
    const avgLast3 = history.length > 0 ? history.slice(0, 3).reduce((acc, curr) => acc + curr.unitPrice, 0) / Math.min(history.length, 3) : null;

    // Dados para o gráfico (ordem cronológica)
    const chartData = [...history].reverse().map(entry => ({
        date: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        valor: entry.unitPrice,
        fornecedor: entry.supplierName,
        fullDate: new Date(entry.date).toLocaleDateString('pt-BR')
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Histórico de Aquisições: ${description}`}
        >
            <div className="space-y-6">
                {/* Cards de Métricas */}
                {history.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm border border-emerald-100">
                                    <DollarIcon className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Último Valor</span>
                            </div>
                            <div className="text-2xl font-black text-emerald-700 tracking-tighter">
                                {lastValue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
                            <div className="flex items-center gap-2 text-blue-600">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm border border-blue-100">
                                    <ActivityIcon className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Média Total</span>
                            </div>
                            <div className="text-2xl font-black text-blue-700 tracking-tighter">
                                {avgAll?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
                            <div className="flex items-center gap-2 text-indigo-600">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm border border-indigo-100">
                                    <TrendingUpIcon className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Média (Últ. 3)</span>
                            </div>
                            <div className="text-2xl font-black text-indigo-700 tracking-tighter">
                                {avgLast3?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gráfico de Flutuação */}
                {history.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUpIcon className="w-3 h-3" /> Flutuação de Valores (Timeline)
                        </h6>
                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                        tickFormatter={(val) => `R$ ${val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                        formatter={(val: number) => [val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Preço']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="valor"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValor)"
                                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-400" />
                    <p className="text-sm text-blue-700">Abaixo estão listadas todas as contratações finalizadas para este item no sistema.</p>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-xl max-h-[400px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-100 font-sans">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Data</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Fornecedor</th>
                                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Valor Unit.</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Protocolo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {history.length > 0 ? history.map((entry, idx) => {
                                // Tentar encontrar a demanda para ter o ID real para navegação
                                const demand = demands.find(d => d.protocol === entry.protocol);

                                return (
                                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50 transition-colors text-xs`}>
                                        <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                                            {new Date(entry.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 font-bold max-w-[150px] truncate" title={entry.supplierName}>
                                            {entry.supplierName}
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-600 font-black whitespace-nowrap">
                                            {entry.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono uppercase">
                                            {demand && onNavigateToDemand ? (
                                                <button
                                                    onClick={() => {
                                                        onNavigateToDemand(demand.id);
                                                        onClose();
                                                    }}
                                                    className="bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 mx-auto border border-blue-100"
                                                >
                                                    {entry.protocol}
                                                    <ExternalLinkIcon className="w-2.5 h-2.5" />
                                                </button>
                                            ) : (
                                                <span className="text-slate-400">#{entry.protocol}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                                        Nenhum histórico encontrado para este item.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PriceHistoryModal;
