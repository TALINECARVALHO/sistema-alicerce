
import React, { useMemo } from 'react';
import { Demand, Supplier, DemandStatus, Group } from '../types';
import PageHeader from './PageHeader';
import StatCard from './StatCard';
import { DollarIcon, CheckCircleIcon, ClockIcon, DemandsIcon, BellIcon, ClipboardListIcon, ChartBarIcon, QAIcon, BoxIcon, ExclamationCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon } from './icons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface SupplierDashboardProps {
    demands: Demand[];
    supplier: Supplier; // Represents the logged-in supplier
    groups: Group[]; // Passed to map names to IDs
    onSelectDemand: (demand: Demand) => void;
    onViewOpportunities: () => void;
    onViewQA?: () => void; // New prop to navigate to Q&A
    onViewSupplierData?: () => void;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ demands, supplier, groups, onSelectDemand, onViewOpportunities, onViewQA, onViewSupplierData }) => {

    // Identify the Supplier's Group IDs based on their Group Names
    const supplierGroupIds = useMemo(() => {
        if (!supplier || !groups) return [];
        return groups
            .filter(g => (supplier.groups || []).includes(g.name))
            .map(g => g.id);
    }, [supplier, groups]);

    const supplierStats = useMemo(() => {
        if (!supplier) return { submitted: 0, won: 0, totalValue: 0, inAnalysis: 0 };

        const isRealProposal = (p: any) => !p.observations?.includes('DECLINED_BY_SUPPLIER');

        const myProposals = demands.flatMap(d => d.proposals
            .filter(p => p.supplierName === supplier.name && isRealProposal(p))
            .map(p => ({ ...p, demandStatus: d.status, demandTitle: d.title, demandProtocol: d.protocol, demandId: d.id }))
        );

        const wonDemands = demands.filter(d => d.winner?.supplierName === supplier.name);

        return {
            submitted: myProposals.length,
            won: wonDemands.length,
            totalValue: wonDemands.reduce((acc, d) => acc + (d.winner?.totalValue || 0), 0),
            inAnalysis: myProposals.filter(p => p.demandStatus === DemandStatus.EM_ANALISE).length,
        };
    }, [demands, supplier]);

    // --- Chart Data Calculation ---
    const chartsData = useMemo(() => {
        if (!supplier) return { pieData: [], barData: [] };

        const statusCounts = { Won: 0, Lost: 0, Pending: 0 };
        const monthlyData: Record<string, number> = {};

        // Initialize last 6 months for bar chart
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('pt-BR', { month: 'short' });
            monthlyData[key] = 0;
        }

        demands.forEach(d => {
            const myProposal = d.proposals.find(p => p.supplierName === supplier.name);
            const isDeclined = myProposal?.observations?.includes('DECLINED');

            if (myProposal && !isDeclined) {
                // Status Logic
                if (d.status === DemandStatus.VENCEDOR_DEFINIDO || d.status === DemandStatus.CONCLUIDA) {
                    if (d.winner?.supplierName === supplier.name) {
                        statusCounts.Won++;
                        // Financial Logic
                        const date = new Date(d.decisionDate || d.createdAt);
                        const key = date.toLocaleString('pt-BR', { month: 'short' });
                        if (monthlyData[key] !== undefined) {
                            monthlyData[key] += d.winner.totalValue;
                        }
                    } else {
                        statusCounts.Lost++;
                    }
                } else if ([DemandStatus.AGUARDANDO_PROPOSTA, DemandStatus.EM_ANALISE, DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO].includes(d.status)) {
                    statusCounts.Pending++;
                }
            }
        });

        const pieData = [
            { name: 'Ganhos', value: statusCounts.Won, color: '#22c55e' },
            { name: 'Perdidos', value: statusCounts.Lost, color: '#ef4444' },
            { name: 'Em Análise', value: statusCounts.Pending, color: '#eab308' },
        ].filter(d => d.value > 0);

        const barData = Object.entries(monthlyData).map(([name, value]) => ({ name, value }));

        return { pieData, barData };
    }, [demands, supplier]);


    // 1. Opportunities Logic
    const openOpportunities = useMemo(() => {
        if (!supplier) return [];

        return demands.filter(d => {
            const matchesStatus = d.status === DemandStatus.AGUARDANDO_PROPOSTA;
            const matchesGroup = d.items.some(item => supplierGroupIds.includes(item.group_id));
            const hasResponded = d.proposals.some(p =>
                (p.supplierName && p.supplierName === supplier.name) ||
                (p.supplierId && String(p.supplierId) === String(supplier.id))
            );
            return matchesStatus && matchesGroup && !hasResponded;
        });
    }, [demands, supplierGroupIds, supplier]);

    // 2. Responded but still Open
    const respondedOpenDemands = useMemo(() => {
        if (!supplier) return [];
        return demands.flatMap(d => {
            const matchesStatus = d.status === DemandStatus.AGUARDANDO_PROPOSTA;
            const myProposal = d.proposals.find(p =>
                (p.supplierName && p.supplierName === supplier.name) ||
                (p.supplierId && String(p.supplierId) === String(supplier.id))
            );
            if (matchesStatus && myProposal) {
                return [{ ...d, myProposal: myProposal }];
            }
            return [];
        });
    }, [demands, supplier]);

    // 3. In Analysis
    const proposalsInAnalysis = useMemo(() => {
        return demands
            .filter(d => d.status === DemandStatus.EM_ANALISE && d.proposals.some(p => p.supplierName === supplier.name && !p.observations?.includes('DECLINED_BY_SUPPLIER')))
            .slice(0, 5);
    }, [demands, supplier]);

    // 4. Recent UNREAD Answers Logic
    const unseenRecentAnswers = useMemo(() => {
        if (!supplier) return [];

        // Get list of already seen answer IDs from local storage
        let seenAnswers: number[] = [];
        try {
            seenAnswers = JSON.parse(localStorage.getItem('alicerce_seen_answers') || '[]');
        } catch (e) { console.error("Error reading seen answers", e); }

        const answers = [];
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        demands.forEach(d => {
            d.questions.forEach(q => {
                const isMyQuestion = q.supplier_id === supplier.id || q.supplierName === supplier.name;

                // Criteria: Is my question + Has answer + Answered recently + NOT SEEN yet
                if (isMyQuestion && q.answer && q.answeredAt) {
                    const answeredDate = new Date(q.answeredAt);
                    if (answeredDate >= threeDaysAgo && !seenAnswers.includes(q.id)) {
                        answers.push({ ...q, demandTitle: d.title, demandProtocol: d.protocol });
                    }
                }
            });
        });

        return answers.sort((a, b) => new Date(b.answeredAt!).getTime() - new Date(a.answeredAt!).getTime());
    }, [demands, supplier]);

    // --- Document Expiry Logic ---
    const documentStatus = useMemo(() => {
        if (!supplier.documents) return { expired: [], expiringSoon: [] };

        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const expired: string[] = [];
        const expiringSoon: string[] = [];

        supplier.documents.forEach(doc => {
            if (doc.validityDate) {
                const validity = new Date(doc.validityDate);
                // Reset hours for clean comparison
                validity.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (validity < today) {
                    expired.push(doc.name);
                } else if (validity <= thirtyDaysFromNow) {
                    expiringSoon.push(doc.name);
                }
            }
        });

        return { expired, expiringSoon };
    }, [supplier.documents]);


    if (!supplier) return null;

    return (
        <div className="space-y-8 animate-fade-in-down">
            <PageHeader
                title={`Bem-vindo, ${supplier.name}`}
                subtitle="Painel de controle e desempenho comercial."
                showButton={false}
            />

            {/* Document Alerts */}
            {documentStatus.expired.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between mb-2 animate-pulse">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="bg-red-100 p-3 rounded-full text-red-600">
                            <ExclamationCircleIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Documentos Vencidos</h3>
                            <p className="text-red-700 text-sm mt-1">
                                Atenção: Os seguintes documentos expiraram e precisam ser renovados urgentemente: <strong>{documentStatus.expired.join(', ')}</strong>.
                            </p>
                        </div>
                    </div>
                    {onViewSupplierData && (
                        <button
                            onClick={onViewSupplierData}
                            className="whitespace-nowrap px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                        >
                            Regularizar Agora
                        </button>
                    )}
                </div>
            )}

            {documentStatus.expiringSoon.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between mb-2">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Documentos Vencendo em Breve</h3>
                            <p className="text-amber-800 text-sm mt-1">
                                Os seguintes documentos vencem nos próximos 30 dias: <strong>{documentStatus.expiringSoon.join(', ')}</strong>.
                            </p>
                        </div>
                    </div>
                    {onViewSupplierData && (
                        <button
                            onClick={onViewSupplierData}
                            className="whitespace-nowrap px-6 py-3 bg-white text-amber-700 font-bold rounded-lg hover:bg-amber-50 border border-amber-200 transition-colors shadow-sm"
                        >
                            Atualizar Documentos
                        </button>
                    )}
                </div>
            )}

            {/* New Answers Alert */}
            {unseenRecentAnswers.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-6 rounded-xl shadow-sm mb-2 flex flex-col md:flex-row items-center justify-between animate-fade-in-down">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <QAIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Novas Respostas Recebidas</h3>
                            <p className="text-indigo-700 text-sm mt-1">
                                O Departamento de Compras respondeu a <strong>{unseenRecentAnswers.length}</strong> pergunta(s) sua(s) recentemente.
                            </p>
                        </div>
                    </div>
                    {onViewQA && (
                        <button
                            onClick={onViewQA}
                            className="whitespace-nowrap px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm border border-indigo-100"
                        >
                            Ver Respostas
                        </button>
                    )}
                </div>
            )}

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<DemandsIcon />} title="Propostas Enviadas" value={supplierStats.submitted} />
                <StatCard icon={<CheckCircleIcon />} title="Demandas Ganhas" value={supplierStats.won} />
                <StatCard icon={<DollarIcon />} title="Valor Total Ganho" value={supplierStats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <StatCard icon={<ClockIcon />} title="Em Análise" value={supplierStats.inAnalysis} />
            </div>

            {/* Charts Section - Now in Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200/80 lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-slate-500" /> Performance de Propostas
                    </h3>
                    <div className="h-64 w-full">
                        {chartsData.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartsData.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartsData.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p className="text-sm">Sem dados de performance ainda.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200/80 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <DollarIcon className="w-5 h-5 text-green-600" /> Faturamento (Demandas Ganhas - 6 Meses)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData.barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Valor']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Latest Opportunities */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200/80 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-blue-600" />
                        Últimas Oportunidades
                    </h3>
                    <div className="space-y-3 flex-grow">
                        {openOpportunities.slice(0, 5).map(demand => (
                            <div key={demand.id} className="p-3 border border-slate-200/80 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => onSelectDemand(demand)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{demand.protocol}</p>
                                        <p className="text-sm text-slate-500 truncate">{demand.title}</p>
                                    </div>
                                    <div className="text-right pl-2 flex-shrink-0">
                                        <p className="font-semibold text-xs text-amber-600">{new Date(demand.proposalDeadline!).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded p-2 text-[10px] space-y-0.5">
                                    {demand.items.slice(0, 2).map((item, i) => (
                                        <div key={i} className="flex justify-between text-slate-600">
                                            <span>• {item.description}</span>
                                            <span className="font-bold">{item.quantity} {item.unit}</span>
                                        </div>
                                    ))}
                                    {demand.items.length > 2 && <p className="text-blue-600 font-bold">+ {demand.items.length - 2} itens</p>}
                                </div>
                            </div>
                        ))}
                        {openOpportunities.length === 0 && <div className="h-full flex items-center justify-center text-sm text-slate-400 py-8">Nenhuma oportunidade pendente.</div>}
                    </div>
                </div>

                {/* Status Tracking */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200/80 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ClipboardListIcon className="w-5 h-5 text-green-600" />
                        Acompanhamento (Últimas Ações)
                    </h3>
                    <div className="space-y-3 flex-grow">
                        {respondedOpenDemands.slice(0, 3).map(demand => (
                            <div key={demand.id} className="p-3 border border-green-100 bg-green-50/30 rounded-lg cursor-pointer hover:bg-green-50 transition-colors" onClick={() => onSelectDemand(demand)}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-green-700">Aguardando Encerramento</span>
                                    <span className="text-[10px] text-slate-500">{new Date(demand.myProposal.submittedAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <p className="font-medium text-slate-700 text-sm truncate">{demand.title}</p>
                                <p className="text-xs text-slate-500 mt-1">Sua oferta: <strong>{(demand.myProposal.totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                            </div>
                        ))}
                        {proposalsInAnalysis.slice(0, 3).map(demand => (
                            <div key={demand.id} className="p-3 border border-amber-100 bg-amber-50/30 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => onSelectDemand(demand)}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-amber-700">Em Análise (Julgamento)</span>
                                </div>
                                <p className="font-medium text-slate-700 text-sm truncate">{demand.title}</p>
                                <p className="text-xs text-slate-500 mt-1">Aguarde o resultado oficial.</p>
                            </div>
                        ))}
                        {respondedOpenDemands.length === 0 && proposalsInAnalysis.length === 0 && (
                            <div className="h-full flex items-center justify-center text-sm text-slate-400 py-8">Nenhuma atividade recente.</div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default SupplierDashboard;
