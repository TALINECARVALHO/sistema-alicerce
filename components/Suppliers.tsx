
import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo } from 'react';
import { Supplier, SupplierStatus, UserRole, Group, Demand } from '../types';
import PageHeader from './PageHeader';
import Modal from './Modal';
import {
    SearchIcon, UsersIcon, UserIcon, PhoneIcon, MailIcon, LocationMarkerIcon,
    CheckCircleIcon, XCircleIcon, ClockIcon, FileIcon, TagIcon,
    LoginIcon, CogIcon, BuildingIcon, BanIcon, TrashIcon,
    DollarIcon, ShieldCheckIcon, ExternalLinkIcon, DownloadIcon,
    ClipboardListIcon, PencilIcon, ViewListIcon, ViewGridIcon, RefreshIcon, ChartBarIcon,
} from './icons';
import * as api from '../services/api';
import SupplierData from './SupplierData';

interface SuppliersProps {
    suppliers: Supplier[];
    demands: Demand[];
    groups: Group[];
    onNewSupplier: () => void;
    onUpdateStatus: (supplierId: number, newStatus: SupplierStatus, rejectionReason?: string) => void;
    onDeleteSupplier: (supplierId: number) => void;
    onUpdateSupplier: (supplier: Supplier, files?: Record<string, File | null>) => Promise<void>;
    userRole: UserRole;
}

const STATUS_CONFIG: Record<SupplierStatus, { label: string; bg: string; text: string; dot: string }> = {
    Ativo: { label: 'ATIVO', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    Pendente: { label: 'AGUARDANDO', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    Reprovado: { label: 'RECUSADO', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    Inativo: { label: 'INATIVO', bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' },
};

const DataField: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            {icon} {label}
        </span>
        <p className="text-sm font-bold text-slate-700 break-words">{value || '-'}</p>
    </div>
);

const SupplierCard: React.FC<{
    supplier: Supplier;
    onAnalyze: () => void;
    onDelete: () => void;
    onInactivate: () => void;
    onReactivate: () => void;
    onApprove: (s: Supplier) => void;
    userRole: UserRole;
}> = ({ supplier, onAnalyze, onDelete, onInactivate, onReactivate, onApprove, userRole }) => {
    const statusConfig = STATUS_CONFIG[supplier.status];
    const canManage = [UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO, UserRole.ADMIN].includes(userRole);

    return (
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col relative group">
            {/* Header: Icon & Status */}
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${supplier.status === 'Pendente' ? 'bg-amber-100 text-amber-600' :
                    supplier.status === 'Reprovado' ? 'bg-red-100 text-red-600' :
                        supplier.status === 'Ativo' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    {supplier.status === 'Pendente' ? <ClockIcon className="w-6 h-6" /> :
                        supplier.status === 'Reprovado' ? <BuildingIcon className="w-6 h-6" /> : // Using generic icon for rejected based on image
                            supplier.status === 'Ativo' ? <BuildingIcon className="w-6 h-6" /> : <BuildingIcon className="w-6 h-6" />}
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                    {statusConfig.label}
                </span>
            </div>

            {/* Title & Info */}
            <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate" title={supplier.name}>{supplier.name}</h3>
                <p className="text-xs text-slate-400 tracking-wide">CNPJ: {supplier.cnpj}</p>
            </div>

            {/* Contact Block */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-6 flex-1 border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-6 flex justify-center"><UserIcon className="w-4 h-4 text-slate-400" /></div>
                    <span className="text-xs font-medium text-slate-600 truncate">{supplier.contactPerson}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 flex justify-center"><MailIcon className="w-4 h-4 text-slate-400" /></div>
                    <span className="text-xs font-medium text-slate-600 truncate" title={supplier.email}>{supplier.email}</span>
                </div>
                {supplier.phone && (
                    <div className="flex items-center gap-3">
                        <div className="w-6 flex justify-center"><PhoneIcon className="w-4 h-4 text-slate-400" /></div>
                        <span className="text-xs font-medium text-slate-600">{supplier.phone}</span>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-auto">
                <button
                    onClick={onAnalyze}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                >
                    {supplier.status === 'Reprovado' ? 'Ver Motivo' : 'Ver Detalhes'} &rarr;
                </button>

                <div className="flex items-center gap-2">
                    {supplier.status === 'Pendente' && canManage ? (
                        <button onClick={() => onApprove(supplier)} className="px-4 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors">
                            Aprovar
                        </button>
                    ) : (
                        <>
                            {statusConfig.label !== 'INATIVO' && (<button onClick={onAnalyze} className="text-slate-300 hover:text-slate-500 transition-colors"><PencilIcon className="w-4 h-4" /></button>)}
                            {canManage && (
                                <button onClick={onDelete} className="text-slate-300 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                            )}
                            {supplier.status === 'Ativo' && canManage && (
                                <button onClick={onInactivate} title="Inativar Fornecedor" className="text-slate-300 hover:text-orange-500 transition-colors"><BanIcon className="w-4 h-4" /></button>
                            )}
                            {supplier.status === 'Inativo' && canManage && (
                                <button onClick={onReactivate} title="Reativar Fornecedor" className="text-slate-300 hover:text-blue-500 transition-colors"><RefreshIcon className="w-4 h-4" /></button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, demands, groups, onUpdateStatus, onDeleteSupplier, onUpdateSupplier, userRole }) => {
    const { error: toastError } = useToast();
    const canManage = [UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO, UserRole.ADMIN].includes(userRole);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<SupplierStatus>('Ativo');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [analyzingSupplier, setAnalyzingSupplier] = useState<Supplier | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRejectionMode, setIsRejectionMode] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const [confirmApproval, setConfirmApproval] = useState<Supplier | null>(null);
    const [confirmDeletion, setConfirmDeletion] = useState<Supplier | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => s.status === activeTab &&
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.cnpj.includes(searchTerm))
        );
    }, [suppliers, activeTab, searchTerm]);

    const handleExecuteApproval = async () => {
        if (!confirmApproval) return;
        setIsProcessing(true);
        const result = await api.approveSupplierWorkflow(confirmApproval);
        setIsProcessing(false);
        if (result.success) {
            setConfirmApproval(null);
            setAnalyzingSupplier(null);
            window.location.reload();
        } else {
            toastError("Erro: " + result.message);
        }
    };

    const handleViewDocument = async (path: string) => {
        const url = await api.getSupplierDocumentUrl(path);
        if (url) window.open(url, '_blank');
        else toastError("Não foi possível carregar o documento.");
    };

    const handleDownloadDocument = async (path: string, fileName: string) => {
        console.log('🔍 Tentando baixar documento:', { path, fileName });
        const url = await api.getSupplierDocumentUrl(path);
        console.log('📥 URL obtida:', url);

        if (!url) {
            console.error('❌ Falha ao gerar URL');
            toastError("Não foi possível gerar o link de download.");
            return;
        }

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        link.setAttribute('target', '_blank'); // Tentar abrir em nova aba se download falhar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Download iniciado');
    };

    // Custom Tab (matching Demands)
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
        <>
            <div className="space-y-8 animate-fade-in-down">
                <PageHeader title="Fornecedores" subtitle="Gestão e Credenciamento de Empresas" showButton={false} />

                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-100 flex overflow-x-auto custom-scrollbar bg-slate-50/30 p-2 gap-1">
                        <TabItem onClick={() => setActiveTab('Ativo')} isActive={activeTab === 'Ativo'} label="Ativos" icon={<CheckCircleIcon className="w-4 h-4" />} />
                        <TabItem onClick={() => setActiveTab('Pendente')} isActive={activeTab === 'Pendente'} label="Aguardando" icon={<ClockIcon className="w-4 h-4" />} />
                        <TabItem onClick={() => setActiveTab('Reprovado')} isActive={activeTab === 'Reprovado'} label="Recusados" icon={<XCircleIcon className="w-4 h-4" />} />
                        <TabItem onClick={() => setActiveTab('Inativo')} isActive={activeTab === 'Inativo'} label="Inativos" icon={<BanIcon className="w-4 h-4" />} />
                    </div>

                    <div className="p-5 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-grow w-full">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar fornecedor por nome ou CNPJ..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none text-sm font-medium"
                            />
                        </div>

                        <div className="flex gap-3 items-center flex-shrink-0">
                            <div className="bg-slate-100/80 p-1.5 rounded-xl flex items-center gap-1 border border-slate-200">
                                <button onClick={() => setViewMode('cards')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Cards">
                                    <ViewGridIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Lista">
                                    <ViewListIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {filteredSuppliers.length > 0 ? (
                    viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSuppliers.map(s => (
                                <SupplierCard
                                    key={s.id}
                                    supplier={s}
                                    onAnalyze={() => setAnalyzingSupplier(s)}
                                    onDelete={() => setConfirmDeletion(s)}
                                    onApprove={() => setConfirmApproval(s)}
                                    onInactivate={() => onUpdateStatus(s.id, 'Inativo')}
                                    onReactivate={() => onUpdateStatus(s.id, 'Ativo')}
                                    userRole={userRole}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Razão Social</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredSuppliers.map(s => (
                                        <tr key={s.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setAnalyzingSupplier(s)}>
                                            <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{s.cnpj}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{s.contactPerson}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-blue-600 font-black text-[10px] uppercase hover:underline">Detalhes</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-inner">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <UsersIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Nenhum fornecedor {activeTab.toLowerCase()}</h3>
                        <p className="text-slate-400 text-sm">Não há registros para exibir nesta categoria.</p>
                    </div>
                )}
            </div>

            {analyzingSupplier && (
                <Modal isOpen={true} onClose={() => { setAnalyzingSupplier(null); setIsRejectionMode(false); setIsEditing(false); }} title={isEditing ? "Editar Fornecedor" : "Ficha Cadastral"}>
                    <div className="pb-8">
                        {/* Header Clean */}
                        <div className="flex items-start gap-6 border-b border-slate-100 pb-8 mb-8">
                            <div className="w-20 h-20 bg-blue-50/50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100">
                                <BuildingIcon className="w-10 h-10" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">{analyzingSupplier.name}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_CONFIG[analyzingSupplier.status].bg} ${STATUS_CONFIG[analyzingSupplier.status].text}`}>
                                        {STATUS_CONFIG[analyzingSupplier.status].label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-600">CNPJ: {analyzingSupplier.cnpj}</span>
                                    <span className="flex items-center gap-1"><MailIcon className="w-4 h-4 text-slate-400" /> {analyzingSupplier.email}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing && canManage && (
                                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors flex items-center gap-2">
                                        <PencilIcon className="w-4 h-4" /> Editar Dados
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <SupplierData
                                supplier={analyzingSupplier}
                                groups={groups}
                                onUpdateSupplier={async (s, f) => {
                                    await onUpdateSupplier(s, f);
                                    setAnalyzingSupplier(s); // Update local view
                                    setIsEditing(false);
                                }}
                            />
                        ) : (
                            <>
                                {/* Stats Summary */}
                                {(() => {
                                    const participation = demands.filter(d => d.proposals?.some(p => p.supplierId === analyzingSupplier.id));
                                    const totalParticipated = participation.length;
                                    const won = participation.filter(d =>
                                        d.winner?.supplierName === analyzingSupplier.name || // Global winner
                                        d.winner?.items?.some(i => i.supplierName === analyzingSupplier.name) // Item winner
                                    ).length;
                                    const lost = totalParticipated - won;
                                    const winRate = totalParticipated > 0 ? Math.round((won / totalParticipated) * 100) : 0;

                                    return (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                                <span className="text-3xl font-black text-slate-700">{totalParticipated}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Participações</span>
                                            </div>
                                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                                                <span className="text-3xl font-black text-emerald-600">{won}</span>
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Vitórias</span>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
                                                <span className="text-3xl font-black text-red-500">{lost}</span>
                                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Perdidas</span>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                                                <span className="text-3xl font-black text-blue-600">{winRate}%</span>
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Aproveitamento</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Coluna Esquerda: Informações */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <section>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                Informações de Contato
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 bg-slate-50/30 p-6 rounded-2xl border border-slate-100">
                                                <DataField label="Responsável" value={analyzingSupplier.contactPerson} icon={<UserIcon className="w-3.5 h-3.5" />} />
                                                <DataField label="Telefone" value={analyzingSupplier.phone} icon={<PhoneIcon className="w-3.5 h-3.5" />} />
                                                <div className="col-span-2">
                                                    <DataField label="Endereço" value={analyzingSupplier.address} icon={<LocationMarkerIcon className="w-3.5 h-3.5" />} />
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <TagIcon className="w-3.5 h-3.5" /> Categorias / Grupos
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {analyzingSupplier.groups && analyzingSupplier.groups.length > 0 ? (
                                                        analyzingSupplier.groups.map(group => (
                                                            <span key={group} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">
                                                                {group}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">Nenhum grupo vinculado.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </section>


                                        <section>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                Dados Bancários
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-slate-100 bg-white">
                                                <DataField label="Banco" value={analyzingSupplier.bankName || '-'} />
                                                <DataField label="Agência" value={analyzingSupplier.agency || '-'} />
                                                <DataField label="Conta" value={analyzingSupplier.accountNumber || '-'} />
                                                <DataField label="PIX" value={analyzingSupplier.pixKey || '-'} />
                                            </div>
                                        </section>

                                        {analyzingSupplier.status === 'Pendente' && !isRejectionMode && (
                                            <div className="flex gap-3 pt-4">
                                                <button onClick={() => setConfirmApproval(analyzingSupplier)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">Aprovar Cadastro</button>
                                                <button onClick={() => setIsRejectionMode(true)} className="px-6 py-3 bg-white text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-50 transition-all">Reprovar</button>
                                            </div>
                                        )}

                                        {isRejectionMode && (
                                            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 animate-fade-in-down">
                                                <label className="block text-xs font-bold text-red-700 uppercase mb-2">Motivo da Reprovação</label>
                                                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full p-4 border border-red-200 rounded-xl text-sm min-h-[100px] mb-4 bg-white" placeholder="Descreva o motivo..."></textarea>
                                                <div className="flex gap-3 justify-end">
                                                    <button onClick={() => setIsRejectionMode(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                                    <button onClick={async () => {
                                                        await api.rejectSupplier(analyzingSupplier.id, rejectionReason);
                                                        setAnalyzingSupplier(null);
                                                        window.location.reload();
                                                    }} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm">Confirmar Reprovação</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Coluna Direita: Documentos */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                            Documentação
                                        </h4>
                                        <div className="space-y-3">
                                            {(() => {
                                                console.log('🔍 DEBUG: Documentos do fornecedor:', analyzingSupplier.documents);
                                                return analyzingSupplier.documents?.map((doc, idx) => {
                                                    console.log(`📄 Documento ${idx}:`, doc);
                                                    console.log(`   - storagePath existe?`, !!doc.storagePath);
                                                    console.log(`   - storagePath valor:`, doc.storagePath);
                                                    return (
                                                        <div key={idx} className="p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-blue-500"><FileIcon className="w-5 h-5" /></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</p>
                                                                    <p className="text-[10px] text-slate-400">
                                                                        {doc.validityDate ? `Validade: ${new Date(doc.validityDate).toLocaleDateString()}` : 'Sem validade'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {doc.storagePath && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleDownloadDocument(doc.storagePath!, doc.fileName || doc.name)} className="w-full py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                                                        Baixar Documento
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                            {(!analyzingSupplier.documents || analyzingSupplier.documents.length === 0) && (
                                                <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    Sem documentos.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Modal >
            )}

            {
                confirmApproval && (
                    <Modal isOpen={true} onClose={() => setConfirmApproval(null)} title="Finalizar Homologação">
                        <div className="space-y-6">
                            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                                <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg h-fit"><MailIcon className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="font-bold text-blue-900 text-lg leading-tight">Envio de Acesso Automático</h4>
                                    <p className="text-sm text-blue-700 leading-relaxed mt-1">Ao confirmar, o sistema enviará um e-mail com as credenciais de acesso para: <br /><b className="text-blue-900 text-base">{confirmApproval.email}</b>.</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setConfirmApproval(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button onClick={handleExecuteApproval} disabled={isProcessing} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transform active:scale-95 transition-all uppercase tracking-widest">Confirmar</button>
                            </div>
                        </div>
                    </Modal>
                )
            }

            {
                confirmDeletion && (
                    <Modal isOpen={true} onClose={() => setConfirmDeletion(null)} title="Excluir Registro">
                        <div className="space-y-6">
                            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                                <p className="text-slate-600 text-lg">Você está prestes a excluir permanentemente o cadastro de:</p>
                                <h4 className="text-2xl font-black text-red-600 mt-2">{confirmDeletion.name}</h4>
                                <p className="text-xs text-red-400 mt-4 uppercase tracking-widest font-bold">Esta ação não pode ser desfeita e removerá todo o histórico.</p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setConfirmDeletion(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button onClick={() => { onDeleteSupplier(confirmDeletion.id); setConfirmDeletion(null); }} className="bg-red-600 text-white px-10 py-3 rounded-xl font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all uppercase tracking-widest">Excluir Agora</button>
                            </div>
                        </div>
                    </Modal>
                )
            }
        </>
    );
};

export default Suppliers;
