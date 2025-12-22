
import React, { useMemo } from 'react';
import { Supplier, Group, SupplierStatus, UserRole, DashboardStats, Demand, DemandStatus } from '../types';
import StatCard from './StatCard';
import { DemandsIcon, SuppliersIcon, GroupsIcon, ClockIcon, UsersIcon, CheckCircleIcon, XCircleIcon, DollarIcon, ChartBarIcon, QAIcon, LightningBoltIcon } from './icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface DashboardProps {
    stats: DashboardStats | null;
    suppliers: Supplier[];
    groups: Group[];
    demands: Demand[];
    onNewDemand: () => void;
    onNavigateToSuppliers: (tab: SupplierStatus) => void;
    onNavigateToQA: () => void;
    userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, suppliers, groups, demands, onNewDemand, onNavigateToSuppliers, onNavigateToQA, userRole }) => {
    const safeStats: DashboardStats = stats || {
        total: 0, open: 0, drafts: 0, closed: 0, pendingSuppliers: 0, activeSuppliers: 0, totalGroups: 0
    };

    const canManage = [UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO].includes(userRole);

    const analytics = useMemo(() => {
        let totalVolume = 0;
        let economy = 0;
        const pendingQuestions = demands.reduce((acc, d) => acc + (d.questions?.filter(q => !q.answer).length || 0), 0);

        // Calcular demandas críticas (vencem em 24h)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const criticalDemands = demands.filter(d => d.status === DemandStatus.AGUARDANDO_PROPOSTA && d.proposalDeadline && new Date(d.proposalDeadline) <= tomorrow).length;

        demands.forEach(d => {
            if (d.winner) {
                totalVolume += d.winner.totalValue;
                if (d.proposals && d.proposals.length > 1) {
                    const valid = d.proposals.filter(p => !p.observations?.includes('DECLINED'));
                    const max = Math.max(...valid.map(p => p.totalValue || 0));
                    economy += (max - d.winner.totalValue);
                }
            }
        });

        // Check for expiring documents (30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        let expiringDocsCount = 0;
        suppliers.forEach(s => {
            if (s.status === 'Ativo' && s.documents) {
                const hasExpiring = s.documents.some(doc => {
                    if (!doc.validityDate) return false;
                    const vDate = new Date(doc.validityDate);
                    return vDate <= thirtyDaysFromNow;
                });
                if (hasExpiring) expiringDocsCount++;
            }
        });

        return { totalVolume, economy, pendingQuestions, criticalDemands, expiringDocsCount };
    }, [demands]);

    const evolutionData = useMemo(() => {
        const monthMap = new Map();
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
            monthMap.set(key, 0);
        }
        demands.forEach(d => {
            const date = new Date(d.createdAt);
            const key = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
            if (monthMap.has(key)) monthMap.set(key, monthMap.get(key) + 1);
        });
        return Array.from(monthMap.entries()).map(([name, value]) => ({ name, demandas: value }));
    }, [demands]);

    const topDepartments = useMemo(() => {
        const counts: Record<string, number> = {};
        demands.forEach(d => {
            const dept = d.requestingDepartment || 'Não Informado';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [demands]);

    const statusDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        demands.forEach(d => {
            counts[d.status] = (counts[d.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [demands]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-10 animate-fade-in-down pb-12">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight lg:text-5xl">Painel de Controle</h1>
                    <p className="mt-2 text-slate-500 font-medium text-lg">Visão geral da operação de compras.</p>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">


                <StatCard icon={<DemandsIcon className="w-6 h-6" />} title="Em Cotação" value={safeStats.open} subtitle="Propostas sendo recebidas" variant="blue" />
                <StatCard icon={<CheckCircleIcon className="w-6 h-6" />} title="Economia Estimada" value={analytics.economy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} subtitle="Eficiência do sistema" variant="emerald" />
                <StatCard icon={<SuppliersIcon className="w-6 h-6" />} title="Fornecedores" value={safeStats.activeSuppliers} subtitle={`${safeStats.pendingSuppliers} aguardando análise`} variant="indigo" />
                <StatCard icon={<QAIcon className="w-6 h-6" />} title="Dúvidas Pendentes" value={analytics.pendingQuestions} subtitle="Requer atenção imediata" variant="purple" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Charts and Analysis */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <span className="bg-blue-50 p-2 rounded-xl text-blue-600"><ChartBarIcon className="w-6 h-6" /></span>
                                Volume de Demandas
                            </h3>
                            <select className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100">
                                <option>Últimos 6 meses</option>
                                <option>Este ano</option>
                            </select>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDemands" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area name="Volume de Demandas" type="monotone" dataKey="demandas" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorDemands)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Departments Chart */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 z-10 relative">Top 5 Secretarias</h3>
                            <div className="h-48 w-full z-10 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topDepartments} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                        <Bar name="Quantidade" dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Distribution Chart */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 z-10 relative">Status dos Processos</h3>
                            <div className="h-48 w-full z-10 relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                        <Legend
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            iconType="circle"
                                            wrapperStyle={{ paddingLeft: '20px', fontSize: '10px', maxWidth: '40%' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Economia Gerada</p>
                                    <h4 className="text-2xl font-black text-slate-800 mt-1">{analytics.economy.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                                </div>
                                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><DollarIcon className="w-6 h-6" /></div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-3 font-medium">65% da meta mensal atingida</p>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processos Ativos</p>
                                    <h4 className="text-2xl font-black text-slate-800 mt-1">{safeStats.total}</h4>
                                </div>
                                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><LightningBoltIcon className="w-6 h-6" /></div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-3 font-medium">40% acima da média histórica</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activities & Actions */}
                <div className="space-y-8">
                    {/* Action Center */}
                    {canManage && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] -ml-10 -mb-10"></div>

                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <span className="p-1.5 bg-white/10 rounded-lg"><LightningBoltIcon className="w-4 h-4 text-yellow-300" /></span>
                                    Ações Prioritárias
                                </h3>

                                <div className="space-y-3">
                                    {analytics.criticalDemands > 0 && (
                                        <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl flex items-center gap-4 hover:bg-red-500/30 transition-colors cursor-pointer" onClick={() => onNavigateToSuppliers('Pendente')}>
                                            <div className="bg-red-500 p-2 rounded-lg text-white font-bold text-xs shadow-lg animate-pulse">URGENTE</div>
                                            <div>
                                                <p className="font-bold text-sm text-red-100">{analytics.criticalDemands} cotas vencendo</p>
                                                <p className="text-xs text-red-200/60">Ação necessária em 24h</p>
                                            </div>
                                        </div>
                                    )}

                                    {analytics.expiringDocsCount > 0 && (
                                        <div className="bg-orange-500/20 border border-orange-500/30 p-4 rounded-xl flex items-center gap-4 hover:bg-orange-500/30 transition-colors cursor-pointer" onClick={() => onNavigateToSuppliers('Ativo')}>
                                            <div className="bg-orange-500 p-2 rounded-lg text-white font-bold text-xs shadow-lg"><ClockIcon className="w-4 h-4" /></div>
                                            <div>
                                                <p className="font-bold text-sm text-orange-100">{analytics.expiringDocsCount} Fornecedores</p>
                                                <p className="text-xs text-orange-200/60">Documentos vencidos ou a vencer</p>
                                            </div>
                                        </div>
                                    )}

                                    {safeStats.pendingSuppliers > 0 && (
                                        <button onClick={() => onNavigateToSuppliers('Pendente')} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-all"><UsersIcon className="w-4 h-4" /></div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm text-slate-100">{safeStats.pendingSuppliers} Novos Cadastros</p>
                                                    <p className="text-xs text-slate-400">Aguardando aprovação</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{safeStats.pendingSuppliers}</div>
                                        </button>
                                    )}

                                    <button onClick={onNavigateToQA} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition-all"><QAIcon className="w-4 h-4" /></div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm text-slate-100">Central de Dúvidas</p>
                                                <p className="text-xs text-slate-400">{analytics.pendingQuestions} perguntas não lidas</p>
                                            </div>
                                        </div>
                                    </button>

                                    {analytics.criticalDemands === 0 && safeStats.pendingSuppliers === 0 && analytics.expiringDocsCount === 0 && (
                                        <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                                            <p className="text-sm font-medium text-emerald-100">Tudo em dia!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Activity Feed */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            Últimas Atividades
                        </h3>
                        <div className="space-y-6 relative ml-3 border-l border-slate-100 pl-6 pb-2">
                            {demands.slice(0, 5).map((d, i) => (
                                <div key={d.id} className="relative">
                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">Nova demanda criada</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{d.title}</p>
                                </div>
                            ))}
                            {suppliers.slice(0, 3).map((s, i) => (
                                <div key={s.id} className="relative">
                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white bg-emerald-500 shadow-sm"></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        Recentemente
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">Novo fornecedor</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{s.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.5s ease-out forwards;
                }
            `}</style>
        </div >
    );
};

export default Dashboard;
