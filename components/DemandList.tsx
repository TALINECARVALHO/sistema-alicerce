
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Demand, UserRole, DemandStatus, Group, Supplier } from '../types';
import { STATUS_COLORS } from '../constants';
import PageHeader from './PageHeader';
// KanbanBoard removed
import CalendarBoard from './CalendarBoard';

import { AuditService } from '../services/AuditService';
import { useToast } from '../contexts/ToastContext';
import {
    SearchIcon, LocationMarkerIcon, TagIcon, ChartBarIcon, CalendarIcon,
    ClockIcon, CheckCircleIcon, XCircleIcon, ClipboardListIcon,
    ArchiveIcon, ShieldCheckIcon, FileIcon, FilterIcon, LightningBoltIcon, BoxIcon, TrashIcon
} from './icons';
import * as api from '../services/api';

interface DemandListProps {
    groups: Group[];
    suppliers: Supplier[];
    userRole: UserRole;
    onSelectDemand: (demand: Demand) => void;
    onNewDemand: () => void;
    currentSupplier?: Supplier;
}

const DemandCard: React.FC<{ demand: Demand; groups: Group[]; userRole: UserRole; onSelect: () => void; onDelete: (id: number) => void; currentSupplier?: Supplier }> = ({ demand, groups, userRole, onSelect, onDelete, currentSupplier }) => {
    const { deadlineText, isUrgent } = useMemo(() => {
        if (!demand.proposalDeadline) {
            if ([DemandStatus.RASCUNHO, DemandStatus.REPROVADA, DemandStatus.CANCELADA].includes(demand.status)) {
                return { deadlineText: 'N/A', isUrgent: false };
            }
            return { deadlineText: 'Aguardando Aprovação', isUrgent: false };
        }
        const deadline = new Date(demand.proposalDeadline);
        const now = new Date();
        const deadlineDateOnly = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = deadlineDateOnly.getTime() - nowDateOnly.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const deadlineDateString = deadline.toLocaleDateString('pt-BR');
        if (diffDays < 0) return { deadlineText: `Encerrado`, isUrgent: true };
        if (diffDays === 0) return { deadlineText: `Hoje`, isUrgent: true };
        if (diffDays === 1) return { deadlineText: `Amanhã`, isUrgent: true };
        return { deadlineText: `${diffDays} dias`, isUrgent: false };
    }, [demand.proposalDeadline, demand.status]);

    const statusColor = STATUS_COLORS[demand.status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

    // Check interaction status (for suppliers)
    const supplierStatus = useMemo(() => {
        if (userRole !== UserRole.FORNECEDOR || !currentSupplier) return null;
        const myProposal = demand.proposals.find(p =>
            String(p.supplierId) === String(currentSupplier.id) ||
            String(p.supplierName) === String(currentSupplier.name) ||
            String((p as any).supplier_id) === String(currentSupplier.id)
        );
        if (!myProposal) return null;
        if (myProposal.observations?.includes('DECLINED_BY_SUPPLIER')) {
            return { label: 'Declinada', type: 'declined', style: 'bg-slate-100 text-slate-500 border-slate-200' };
        }
        return { label: 'Respondida', type: 'responded', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    }, [demand.proposals, userRole, currentSupplier]);

    const isDeclined = supplierStatus?.type === 'declined';
    const canDelete = [UserRole.GESTOR_SUPREMO, UserRole.CONTRATACOES].includes(userRole);

    return (
        <div
            className={`bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-200/20 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden ${isDeclined ? 'opacity-70 grayscale-[0.5]' : ''}`}
        >
            {/* Top Row: Icon & Status */}
            <div className="flex justify-between items-start">
                <div onClick={onSelect} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-blue-200 cursor-pointer">
                    <ClipboardListIcon className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-end gap-1">
                    {supplierStatus ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border ${supplierStatus.style}`}>
                            {supplierStatus.type === 'declined' ? <XCircleIcon className="w-3 h-3" /> : <CheckCircleIcon className="w-3 h-3" />}
                            {supplierStatus.label}
                        </span>
                    ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${statusColor.bg} ${statusColor.text}`}>
                            {demand.status}
                        </span>
                    )}
                    {(demand.status === DemandStatus.AGUARDANDO_PROPOSTA) && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50'}`}>
                            <ClockIcon className="w-3 h-3" /> {deadlineText}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div onClick={onSelect} className="mt-6 mb-6 cursor-pointer">
                <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors" title={demand.title}>
                    {demand.title}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{demand.protocol}</p>

                <div className="mt-5 space-y-2.5">
                    <div className="flex items-center text-xs font-medium text-slate-500 gap-3 group/item">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:text-blue-500 transition-colors"><ChartBarIcon className="w-3.5 h-3.5" /></div>
                        <span className="truncate">{demand.requestingDepartment}</span>
                    </div>
                    <div className="flex items-center text-xs font-medium text-slate-500 gap-3 group/item">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:text-blue-500 transition-colors"><BoxIcon className="w-3.5 h-3.5" /></div>
                        <span className="truncate">{demand.items?.length || 0} itens solicitados</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                <div className="flex-grow flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                    {demand.createdAt ? new Date(demand.createdAt).toLocaleDateString('pt-BR') : '-'}
                </div>
                <div className="flex items-center gap-2">
                    {canDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(demand.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Demanda"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={onSelect} className="flex items-center gap-1 text-xs font-black text-blue-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        Ver Detalhes →
                    </button>
                </div>
            </div>
        </div>
    );
};

const DemandTable: React.FC<{ demands: Demand[]; userRole: UserRole; onSelect: (d: Demand) => void; onDelete: (id: number) => void }> = ({ demands, userRole, onSelect, onDelete }) => {
    const canDelete = [UserRole.GESTOR_SUPREMO, UserRole.CONTRATACOES].includes(userRole);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Objeto / Título</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Secretaria</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {demands.map(demand => {
                            const statusColor = STATUS_COLORS[demand.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                            return (
                                <tr key={demand.id} onClick={() => onSelect(demand)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-400">{demand.protocol}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{demand.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{demand.requestingDepartment}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-bold">{demand.items?.length || 0} itens</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-lg ${statusColor.bg} ${statusColor.text}`}>
                                            {demand.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {canDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(demand.id); }}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir Demanda"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:text-blue-800">Analisar</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {demands.length === 0 && <div className="p-12 text-center text-slate-400 italic font-medium">Nenhuma demanda encontrada nesta categoria.</div>}
        </div>
    );
};

type ManagerTab = 'rascunhos' | 'em_cotacao' | 'em_analise' | 'com_vencedor' | 'encerrada' | 'todas';

const DemandList: React.FC<DemandListProps> = ({ groups, suppliers, userRole, onSelectDemand, onNewDemand, currentSupplier }) => {
    const { success, error: toastError } = useToast();
    const isSupplier = userRole === UserRole.FORNECEDOR;
    const isCitizen = userRole === UserRole.CIDADAO;


    const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem('demand_search') || '');
    const [viewMode, setViewMode] = useState<'cards' | 'table' | 'board' | 'calendar'>(() => {
        const saved = sessionStorage.getItem('demand_view_mode');
        if (saved) return saved as any;
        return userRole === UserRole.ALMOXARIFADO ? 'table' : 'cards';
    });

    const [supplierFilter, setSupplierFilter] = useState<'open' | 'responded' | 'declined' | 'all'>(() => {
        return (sessionStorage.getItem('demand_supplier_tab') as any) || 'open';
    });

    const [managerTab, setManagerTab] = useState<ManagerTab>(() => {
        return (sessionStorage.getItem('demand_manager_tab') as any) || 'todas';
    });

    const [demands, setDemands] = useState<Demand[]>([]);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const PAGE_SIZE = 12;

    useEffect(() => { sessionStorage.setItem('demand_search', searchTerm); }, [searchTerm]);
    useEffect(() => { sessionStorage.setItem('demand_view_mode', viewMode); }, [viewMode]);
    useEffect(() => { sessionStorage.setItem('demand_supplier_tab', supplierFilter); }, [supplierFilter]);
    useEffect(() => { sessionStorage.setItem('demand_manager_tab', managerTab); }, [managerTab]);

    const supplierGroupIds = useMemo(() => {
        if (!currentSupplier || !groups) return undefined;
        return groups
            .filter(g => currentSupplier.groups.includes(g.name))
            .map(g => g.id);
    }, [currentSupplier, groups]);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.")) return;
        try {
            await api.deleteDemand(id);
            AuditService.logAction('DELETE_DEMAND', 'DEMAND', { demandId: id });
            success("Demanda excluída com sucesso.");
            loadDemands();
        } catch (e: any) {
            toastError("Erro ao excluir demanda: " + api.formatError(e));
        }
    };

    const loadDemands = useCallback(async () => {
        if (!isMounted.current) return;
        setIsLoading(true);
        setError(null);

        try {
            let statusFilter: DemandStatus | undefined = undefined;
            let statusesFilter: string[] | undefined = undefined;

            if (isCitizen) {
                statusFilter = DemandStatus.VENCEDOR_DEFINIDO;
            } else if (!isSupplier) {
                switch (managerTab) {
                    case 'rascunhos': statusFilter = DemandStatus.RASCUNHO; break;
                    case 'em_cotacao': statusFilter = DemandStatus.AGUARDANDO_PROPOSTA; break;
                    case 'em_analise': statusFilter = DemandStatus.EM_ANALISE; break;
                    case 'com_vencedor': statusFilter = DemandStatus.VENCEDOR_DEFINIDO; break;
                    case 'encerrada': statusesFilter = [DemandStatus.CANCELADA, DemandStatus.REPROVADA, DemandStatus.FECHADA]; break;
                }
            }

            const effectivePageSize = (viewMode === 'calendar' || viewMode === 'board') ? 100 : PAGE_SIZE;

            const { data, count } = await api.fetchDemands(
                page,
                effectivePageSize,
                { searchTerm, status: statusFilter, statuses: statusesFilter },
                isSupplier ? supplierGroupIds : undefined
            );

            if (isMounted.current) {
                setDemands(data);
                setTotalCount(count);
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error("Failed to load demands", error);
            if (isMounted.current) {
                setError("Falha na conexão com o servidor.");
                setIsLoading(false);
            }
        }
    }, [page, searchTerm, isSupplier, isCitizen, managerTab, viewMode, supplierGroupIds]);

    useEffect(() => {
        loadDemands();
    }, [loadDemands]);

    const displayedDemands = useMemo(() => {
        if (isSupplier && currentSupplier) {
            return demands.filter(d => {
                const myProposal = d.proposals.find(p =>
                    String(p.supplierId) === String(currentSupplier.id) ||
                    String(p.supplierName) === String(currentSupplier.name) ||
                    String((p as any).supplier_id) === String(currentSupplier.id)
                );
                const hasResponded = !!myProposal;
                const isDeclined = myProposal?.observations?.includes('DECLINED_BY_SUPPLIER');
                switch (supplierFilter) {
                    case 'open': return d.status === DemandStatus.AGUARDANDO_PROPOSTA && !hasResponded;
                    case 'responded': return hasResponded && !isDeclined;
                    case 'declined': return isDeclined;
                    default: return (d.status === DemandStatus.AGUARDANDO_PROPOSTA) || hasResponded;
                }
            });
        }
        return demands;
    }, [demands, isSupplier, currentSupplier, supplierFilter]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const TabItem = ({ isActive, onClick, label, icon }: any) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-2.5 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 relative border-r border-slate-100 last:border-r-0 ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 rounded-lg scale-[1.02] z-10'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
        >
            <span className={isActive ? 'text-white' : 'text-slate-300'}>{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in-down">
            <PageHeader
                title={userRole === UserRole.ALMOXARIFADO ? "Análise Processual" : isSupplier ? "Painel de Oportunidades" : "Controle de Demandas"}
                subtitle={userRole === UserRole.ALMOXARIFADO ? "Validação técnica de pedidos internos" : isSupplier ? "Cotações abertas para sua área de atuação" : "Gestão centralizada do ciclo de compras"}
                buttonText="Registrar Demanda"
                onButtonClick={onNewDemand}
                showButton={[UserRole.SECRETARIA, UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO].includes(userRole)}
            />

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 flex overflow-x-auto custom-scrollbar bg-slate-50/30 p-2 gap-1">
                    {isSupplier ? (
                        <>
                            <TabItem onClick={() => setSupplierFilter('all')} isActive={supplierFilter === 'all'} label="Todas" icon={<ClipboardListIcon className="w-4 h-4" />} />
                            <TabItem onClick={() => setSupplierFilter('open')} isActive={supplierFilter === 'open'} label="Em Aberto" icon={<ClockIcon className="w-4 h-4" />} />
                            <TabItem onClick={() => setSupplierFilter('responded')} isActive={supplierFilter === 'responded'} label="Respondidas" icon={<CheckCircleIcon className="w-4 h-4" />} />
                            <TabItem onClick={() => setSupplierFilter('declined')} isActive={supplierFilter === 'declined'} label="Declinadas" icon={<XCircleIcon className="w-4 h-4" />} />
                        </>
                    ) : !isCitizen ? (
                        <>
                            <TabItem onClick={() => { setManagerTab('todas'); setPage(1); }} isActive={managerTab === 'todas'} label="Todas" icon={<ClipboardListIcon className="w-4 h-4" />} />
                            <TabItem onClick={() => { setManagerTab('rascunhos'); setPage(1); }} isActive={managerTab === 'rascunhos'} label="Rascunhos" icon={<FileIcon className="w-4 h-4" />} />
                            <TabItem onClick={() => { setManagerTab('em_cotacao'); setPage(1); }} isActive={managerTab === 'em_cotacao'} label="Em Cotação" icon={<ClockIcon className="w-4 h-4" />} />
                            <TabItem onClick={() => { setManagerTab('em_analise'); setPage(1); }} isActive={managerTab === 'em_analise'} label="Em Análise" icon={<ChartBarIcon className="w-4 h-4" />} />
                            <TabItem onClick={() => { setManagerTab('com_vencedor'); setPage(1); }} isActive={managerTab === 'com_vencedor'} label="Vencedor Definido" icon={<CheckCircleIcon className="w-4 h-4" />} />

                        </>
                    ) : (
                        <TabItem isActive={true} label="Demandas Homologadas" icon={<CheckCircleIcon className="w-4 h-4" />} />
                    )}
                </div>

                <div className="p-5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por ID, título ou secretaria..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none text-sm font-medium"
                        />
                    </div>

                    {!isCitizen && (
                        <div className="flex gap-3 items-center flex-shrink-0">
                            <button
                                onClick={() => loadDemands()}
                                disabled={isLoading}
                                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group"
                                title="Atualizar Lista"
                            >
                                <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            <div className="bg-slate-100/80 p-1.5 rounded-xl flex items-center gap-1 border border-slate-200">
                                <button onClick={() => setViewMode('cards')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Cards">
                                    <div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div></div>
                                </button>
                                <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Tabela">
                                    <div className="flex flex-col gap-1 w-4 h-4 justify-center"><div className="bg-current h-[2px] w-full rounded-full"></div><div className="bg-current h-[2px] w-full rounded-full"></div><div className="bg-current h-[2px] w-full rounded-full"></div></div>
                                </button>

                                <button onClick={() => setViewMode('calendar')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Calendário">
                                    <CalendarIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 flex flex-col gap-3 items-center animate-bounce shadow-lg shadow-red-100">
                    <span className="font-bold">{error}</span>
                    <button onClick={() => loadDemands()} className="text-xs font-black uppercase tracking-widest bg-white border border-red-200 px-6 py-2 rounded-lg hover:bg-red-100 transition-all">Tentar Novamente</button>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-32 text-slate-400 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
                    <p className="font-black text-xs uppercase tracking-widest animate-pulse">Sincronizando Demandas...</p>
                </div>
            ) : displayedDemands.length > 0 ? (
                <div className="space-y-8">
                    {viewMode === 'table' ? (
                        <DemandTable demands={displayedDemands} userRole={userRole} onSelect={onSelectDemand} onDelete={handleDelete} />

                    ) : viewMode === 'calendar' ? (
                        <CalendarBoard demands={displayedDemands} onSelectDemand={onSelectDemand} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {displayedDemands.map((demand) => (
                                <DemandCard key={demand.id} demand={demand} groups={groups} userRole={userRole} onSelect={() => onSelectDemand(demand)} onDelete={handleDelete} currentSupplier={currentSupplier} />
                            ))}
                        </div>
                    )}

                    {(viewMode !== 'board' && viewMode !== 'calendar') && (
                        <div className="flex justify-center items-center gap-6 mt-12 pb-10">
                            <button
                                disabled={page === 1}
                                onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                ← Anterior
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página</span>
                                <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-200">{page}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">de {totalPages || 1}</span>
                            </div>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                Próxima →
                            </button>
                        </div>
                    )}
                </div>
            ) : !error && (
                <div className="text-center py-24 bg-white rounded-3xl shadow-inner border border-slate-100 flex flex-col items-center">
                    <div className="bg-slate-50 p-6 rounded-full mb-6">
                        <FilterIcon className="w-16 h-16 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Nenhum registro encontrado</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                        {isSupplier
                            ? "Não encontramos oportunidades para o filtro selecionado no momento."
                            : "Não há demandas que coincidam com os critérios de busca e status atuais."}
                    </p>
                    {managerTab !== 'todas' && !isSupplier && (
                        <button onClick={() => setManagerTab('todas')} className="mt-8 px-8 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Ver Histórico Completo</button>
                    )}
                </div>
            )}

            <style>{`
            .custom-scrollbar::-webkit-scrollbar { height: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            
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

export default DemandList;
