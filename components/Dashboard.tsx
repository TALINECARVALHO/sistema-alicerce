
import React, { useMemo } from 'react';
import { Supplier, Group, SupplierStatus, UserRole, DashboardStats, Demand, DemandStatus } from '../types';
import {
    DemandsIcon, SuppliersIcon, GroupsIcon, ClockIcon, UsersIcon, CheckCircleIcon,
    XCircleIcon, DollarIcon, ChartBarIcon, QAIcon, LightningBoltIcon, ShieldCheckIcon,
    PlusIcon
} from './icons';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, LabelList
} from 'recharts';
import PageHeader from './PageHeader';

interface DashboardProps {
    stats: DashboardStats | null;
    suppliers: Supplier[];
    groups: Group[];
    demands: Demand[];
    onNewDemand: () => void;
    onNavigateToSuppliers: (tab: SupplierStatus) => void;
    onNavigateToQA: () => void;
    onNavigateToDemands: (status?: DemandStatus) => void;
    userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, suppliers, groups, demands, onNewDemand, onNavigateToSuppliers, onNavigateToQA, onNavigateToDemands, userRole }) => {
    const safeStats: DashboardStats = stats || {
        total: 0, open: 0, drafts: 0, closed: 0, pendingSuppliers: 0, activeSuppliers: 0, totalGroups: 0, pendingApproval: 0
    };

    const canManage = [UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO].includes(userRole);
    const isWarehouse = userRole === UserRole.ALMOXARIFADO || canManage;

    const analytics = useMemo(() => {
        let totalVolumeMes = 0;
        let economy = 0;
        let volumePendenteAnalise = 0;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const pendingQuestions = demands.reduce((acc, d) => acc + (d.questions?.filter(q => !q.answer).length || 0), 0);

        // Novas métricas solicitadas
        const pedidosMes = demands.filter(d => new Date(d.createdAt) >= startOfMonth).length;
        const finalizadosMes = demands.filter(d =>
            new Date(d.createdAt) >= startOfMonth &&
            (d.status === DemandStatus.CONCLUIDA || d.status === DemandStatus.VENCEDOR_DEFINIDO)
        ).length;

        demands.forEach(d => {
            if (d.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO) {
                const demandTotal = d.items.reduce((acc, item) => acc + (item.quantity * ((item as any).target_price || 0)), 0);
                volumePendenteAnalise += demandTotal;
            }

            if (d.winner && d.winner.totalValue > 0) {
                if (new Date(d.createdAt) >= startOfMonth) {
                    totalVolumeMes += d.winner.totalValue;
                }

                if (d.proposals && d.proposals.length > 0) {
                    const valid = d.proposals.filter(p => !p.observations?.includes('DECLINED'));
                    const validValues = valid.map(p => p.totalValue || 0);

                    // The baseline for economy is the highest bid received (or the winner itself if it's the only/highest)
                    // This prevents negative economy if data is inconsistent
                    const max = Math.max(d.winner.totalValue, ...validValues);

                    if (max > d.winner.totalValue) {
                        economy += (max - d.winner.totalValue);
                    }
                }
            }
        });

        return { totalVolumeMes, economy, pendingQuestions, pedidosMes, finalizadosMes, volumePendenteAnalise };
    }, [demands]);

    const groupPerformance = useMemo(() => {
        const groupMap = new Map();

        demands.forEach(d => {
            if (d.winner && d.winner.totalValue > 0) {
                // Since a demand can have items from different groups, 
                // but usually the winner is per demand, we'll attribute to the main group if possible
                // or iterate over items. For simplicity and as per common logic, 
                // we'll sum up item values by group.
                d.items.forEach(item => {
                    if (item.group_id) {
                        const group = groups.find(g => g.id === item.group_id);
                        const name = group ? group.name : 'Outros';
                        const current = groupMap.get(name) || 0;

                        // If winner exists, we try to match the price from items
                        // For a dashboard, a close approximation or direct winner value is preferred.
                        // Let's use demand winner value if it's not item-based, 
                        // or item winners if it is.
                        if (d.winner?.mode === 'item' && d.winner.items) {
                            const wItem = d.winner.items.find(wi => (wi.itemId || (wi as any).item_id) === item.id);
                            if (wItem) {
                                groupMap.set(name, current + wItem.totalValue);
                            }
                        } else if (d.winner?.mode === 'global' && d.winner.supplierId) {
                            // If global, we distribute proportionally or just count the demand?
                            // Usually groups are per item. If global, we use the item's part of the total?
                            // Let's assume most demands are focused.
                            // To be accurate: sum only what was actually won.
                            const itemTotal = (item.quantity * (item.target_price || 0)); // Fallback
                            // Better: if global winner, we assume the items in the demand contributed to that winner total.
                            // Since we don't have per-item price for global winners easily here, 
                            // we'll use a simplified count or just sum types.
                            // User asked for "valores ou demandas". Let's do TOP 5 by VALUE.
                            groupMap.set(name, current + (d.winner.totalValue / d.items.length));
                        }
                    }
                });
            }
        });

        return Array.from(groupMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [demands, groups]);

    const chartData = useMemo(() => {
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

    const departmentPerformance = useMemo(() => {
        const deptMap = new Map();
        demands.forEach(d => {
            const dept = d.requestingDepartment || 'Outros';
            deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });

        return Array.from(deptMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [demands]);

    // Componente de Cartão Superior (v1)
    const StatCard = ({ icon: Icon, title, value, subtitle, onClick }: any) => (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2.5 hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <h3 className="text-2xl font-black text-slate-800">{value}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 animate-fade-in-down pb-12 bg-slate-50/30 min-h-screen">

            {/* Header */}
            <div className="px-4 pt-4">
                <PageHeader
                    title="Painel de Controle"
                    subtitle="Gestão Estratégica de Compras Municipais"
                    buttonText="Nova Demanda"
                    onButtonClick={onNewDemand}
                />
            </div>

            <div className="px-4 space-y-3">

                {/* Grid Superior v1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                        icon={DemandsIcon}
                        title="Em Cotação"
                        value={safeStats.open}
                        subtitle="Propostas sendo recebidas"
                        onClick={() => onNavigateToDemands(DemandStatus.AGUARDANDO_PROPOSTA)}
                    />
                    <StatCard
                        icon={ShieldCheckIcon}
                        title="Para Análise"
                        value={demands.filter(d => d.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO).length}
                        subtitle="Aguardando Almoxarifado"
                        onClick={() => onNavigateToDemands(DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO)}
                    />
                    <StatCard
                        icon={SuppliersIcon}
                        title="Fornecedores Cadastrados"
                        value={safeStats.activeSuppliers}
                        subtitle="Empresas ativas"
                        onClick={() => onNavigateToSuppliers('Ativo')}
                    />
                    <StatCard
                        icon={QAIcon}
                        title="Dúvidas"
                        value={analytics.pendingQuestions}
                        subtitle="Aguardando resposta"
                        onClick={onNavigateToQA}
                    />
                </div>

                {/* Resumo Executivo Mensal (Novo Layout Cards) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Card 1: Volume Homologado (Financeiro) */}
                    <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-2 opacity-10 group-hover:opacity-20 transition-all transform group-hover:scale-110 duration-700 pointer-events-none select-none">
                            <span className="text-[160px] font-black leading-none">$</span>
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4 opacity-90">
                                    <div className="relative">
                                        <div className="absolute -inset-1.5 bg-white/20 blur-sm rounded-full"></div>
                                        <div className="relative flex items-center justify-center bg-white/10 w-8 h-8 rounded-lg">
                                            <span className="absolute -top-1 -right-1 text-[10px] font-black text-amber-300">$</span>
                                            <ChartBarIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Valor Total Homologado</span>
                                </div>
                                <h3 className="text-4xl font-black tracking-tighter mb-1">
                                    R$ {analytics.totalVolumeMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </h3>
                                <p className="text-blue-200 text-sm font-medium">Total finalizado este mês</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Acumulado Mensal</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Fluxo Operacional */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                                <LightningBoltIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fluxo Mensal</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-8 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Demandas</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-800">{analytics.pedidosMes}</span>
                                    <span className="text-xs text-slate-400 font-bold">novos</span>
                                </div>
                            </div>
                            <div className="pl-8 border-l border-slate-100">
                                <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mb-1">Demanda Homologada</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-emerald-600">{analytics.finalizadosMes}</span>
                                    <span className="text-xs text-emerald-600/70 font-bold">ok</span>
                                </div>
                            </div>
                        </div>

                        {/* Decor */}
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-50 rounded-tl-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                    </div>

                    {/* Card 3: Ações Pendentes */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3 h-full">
                        <h3 className="px-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-1 mt-1">Ações Prioritárias</h3>

                        <div className="flex-1 flex flex-col gap-2 justify-center">
                            {/* Dúvidas */}
                            <button
                                onClick={onNavigateToQA}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${analytics.pendingQuestions > 0 ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <QAIcon className={`w-5 h-5 ${analytics.pendingQuestions > 0 ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    <span className={`text-xs font-bold uppercase ${analytics.pendingQuestions > 0 ? 'text-indigo-900' : 'text-slate-500'}`}>Dúvidas Pendentes</span>
                                </div>
                                {analytics.pendingQuestions > 0 && <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{analytics.pendingQuestions}</span>}
                            </button>

                            {/* Fornecedores */}
                            {canManage && (
                                <button
                                    onClick={() => onNavigateToSuppliers('Pendente')}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${safeStats.pendingSuppliers > 0 ? 'bg-blue-50 border-blue-100 hover:bg-blue-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <UsersIcon className={`w-5 h-5 ${safeStats.pendingSuppliers > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className={`text-xs font-bold uppercase ${safeStats.pendingSuppliers > 0 ? 'text-blue-900' : 'text-slate-500'}`}>Cadastros Novos</span>
                                    </div>
                                    {safeStats.pendingSuppliers > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{safeStats.pendingSuppliers}</span>}
                                </button>
                            )}

                            {/* Validações Almoxarifado */}
                            {isWarehouse && (
                                <button
                                    onClick={() => onNavigateToDemands(DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${safeStats.pendingApproval > 0 ? 'bg-amber-50 border-amber-100 hover:bg-amber-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldCheckIcon className={`w-5 h-5 ${safeStats.pendingApproval > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                                        <span className={`text-xs font-bold uppercase ${safeStats.pendingApproval > 0 ? 'text-amber-900' : 'text-slate-500'}`}>Validações Pendentes</span>
                                    </div>
                                    {safeStats.pendingApproval > 0 && <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{safeStats.pendingApproval}</span>}
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                {/* Demandas Pendentes de Análise (Apenas para Almoxarifado/Gestão) */}
                {isWarehouse && demands.filter(d => d.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO).length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-amber-500" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Demandas Pendentes de Análise</h3>
                            </div>
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {demands.filter(d => d.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO).length} Pendentes
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {demands
                                .filter(d => d.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO)
                                .slice(0, 5) // Mostra apenas as 5 mais antigas/urgentes
                                .map(demand => (
                                    <div key={demand.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500">
                                                <ClockIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{demand.protocol}</span>
                                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{demand.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                                    <span>{demand.requestingDepartment}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span>{new Date(demand.createdAt).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onNavigateToDemands(DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
                                        >
                                            Analisar
                                        </button>
                                    </div>
                                ))}
                        </div>
                        {demands.filter(d => d.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO).length > 5 && (
                            <div className="px-6 py-3 bg-slate-50 text-center">
                                <button
                                    onClick={() => onNavigateToDemands(DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO)}
                                    className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
                                >
                                    Ver todas as demandas pendentes
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Seção de Gráficos Inferior (v1) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">

                    {/* Volume de Demandas (Histórico) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <ChartBarIcon className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Evolução de Demandas</h3>
                        </div>
                        <div className="flex-1 min-h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDemandas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="demandas"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorDemandas)"
                                    >
                                        <LabelList
                                            dataKey="demandas"
                                            position="top"
                                            offset={10}
                                            style={{ fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }}
                                        />
                                    </Area>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-50 italic text-[9px] text-slate-400 text-center">
                            Histórico dos últimos 6 meses.
                        </div>
                    </div>

                    {/* Demandas por Secretaria (Quantidades) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <DemandsIcon className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Demandas por Secretaria</h3>
                        </div>

                        <div className="flex-1 min-h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={departmentPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                        width={80}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                                        {departmentPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#10b981', '#059669', '#047857', '#065f46', '#064e3b'][index % 5]} />
                                        ))}
                                        <LabelList
                                            dataKey="value"
                                            position="right"
                                            style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-50 italic text-[9px] text-slate-400 text-center">
                            Secretarias com maior número de pedidos.
                        </div>
                    </div>

                    {/* TOP 5 Grupos por Valor */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarIcon className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Top 5 Categorias (R$)</h3>
                        </div>

                        <div className="flex-1 min-h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={groupPerformance} layout="vertical" margin={{ top: 5, right: 60, left: 40, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                        width={80}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                                        {groupPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][index % 5]} />
                                        ))}
                                        <LabelList
                                            dataKey="value"
                                            position="right"
                                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                            style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-50 italic text-[9px] text-slate-400 text-center">
                            Categorias com maior volume financeiro.
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
        </div>
    );
};

// Extensão rápida de ícone para compatibilidade
const ExclamationCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);

export default Dashboard;
