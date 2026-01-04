import { useToast } from '../contexts/ToastContext';
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from './PageHeader';
import { MailIcon, ChartBarIcon, ShieldCheckIcon, BeakerIcon, ArrowLeftIcon, UserIcon } from './icons';
import * as api from '../services/api';
import { EmailTemplate, Group, CatalogItem, UserRole, Demand } from '../types';
import Groups from './Groups';
import Catalog from './Catalog';
import AdminUsers from './AdminUsers';
import AuxiliaryData from './AuxiliaryData';

interface SettingsPageProps {
    groups: Group[];
    catalogItems: CatalogItem[];
    demands: Demand[];
    userRole: UserRole;
    onNavigate: (page: any) => void;
    onNewGroup: () => void;
    onEditGroup: (group: Group) => void;
    onDeleteGroup: (groupId: string) => void;
    onToggleGroupStatus: (groupId: string) => void;
    onNewCatalogItem: () => void;
    onEditCatalogItem: (item: CatalogItem) => void;
    onDeleteCatalogItem: (itemId: number) => void;
    onDataChange?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
    groups, catalogItems, demands, userRole, onNavigate,
    onNewGroup, onEditGroup, onDeleteGroup, onToggleGroupStatus,
    onNewCatalogItem, onEditCatalogItem, onDeleteCatalogItem, onDataChange
}) => {
    // Navigation State
    const { success, error: toastError } = useToast();
    const [view, setView] = useState<'dashboard' | 'groups' | 'catalog' | 'templates' | 'users' | 'aux'>('dashboard');

    const canManageUsers = [UserRole.GESTOR_SUPREMO, UserRole.CONTRATACOES].includes(userRole);

    // Email Templates State
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [templateForm, setTemplateForm] = useState<{ subject: string, body: string }>({ subject: '', body: '' });
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    // Initial Load
    useEffect(() => {
        if (view === 'templates') loadTemplates();
    }, [view]);

    const selectedTemplate = useMemo(() =>
        templates.find(t => t.id === selectedTemplateId) || null
        , [templates, selectedTemplateId]);

    const loadTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const data = await api.fetchEmailTemplates();
            setTemplates(data);
            if (data.length > 0 && !selectedTemplateId) {
                selectTemplate(data[0]);
            }
        } catch (e: any) {
            console.error("Erro ao carregar templates", e);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const selectTemplate = (template: EmailTemplate) => {
        setSelectedTemplateId(template.id);
        setTemplateForm({ subject: template.subject, body: template.body });
    };

    const handleSaveTemplate = async () => {
        if (!selectedTemplateId) return;
        setIsSavingTemplate(true);
        try {
            const current = templates.find(t => t.id === selectedTemplateId);
            if (!current) return;
            const updated: EmailTemplate = { ...current, subject: templateForm.subject, body: templateForm.body };
            await api.updateEmailTemplate(updated);
            setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? updated : t));
            success("Modelo salvo com sucesso!");
        } catch (e: any) {
            toastError(`Erro ao salvar: ${api.formatError(e)}`);
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleBack = () => setView('dashboard');

    const handleRestoreTemplates = async () => {
        if (confirm("Confirmar restauração dos modelos oficiais? Isso substituirá as edições manuais pelos padrões da prefeitura.")) {
            try {
                await api.seedEmailTemplates();
                await loadTemplates();
                success("Modelos restaurados com sucesso!");
            } catch (error: any) {
                toastError(`ERRO: ${api.formatError(error)}`);
            }
        }
    };

    return (
        <div className="space-y-8 font-sans min-h-[600px]">
            {/* Header with Back Button logic */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        {view === 'dashboard' ? 'Configurações' :
                            view === 'groups' ? 'Gerenciar Grupos' :
                                view === 'aux' ? 'Dados Auxiliares' :
                                    'Modelos de E-mail'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {view === 'dashboard' ? 'Painel de controle geral do sistema.' :
                            view === 'groups' ? 'Adicione, edite ou remova grupos e categorias.' :
                                view === 'aux' ? 'Gerencie listas de secretarias e unidades de medida.' :
                                    'Personalize os textos dos e-mails automáticos.'}
                    </p>
                </div>
                {view !== 'dashboard' && (
                    <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" /> Voltar
                    </button>
                )}
            </div>

            {/* Dashboard View */}
            {view === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onClick={() => setView('groups')} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
                        <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ChartBarIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Grupos e Categorias</h3>
                        <p className="text-slate-500 text-sm mb-4">Gerencie as categorias de demandas e fluxos de aprovação.</p>
                        <div className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full inline-block">
                            {groups.length} Grupos Ativos
                        </div>
                    </button>

                    <button onClick={() => setView('aux')} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
                        <div className="bg-teal-50 w-16 h-16 rounded-xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <BeakerIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Dados Auxiliares</h3>
                        <p className="text-slate-500 text-sm mb-4">Gerencie secretarias e unidades de medida.</p>
                        <div className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full inline-block">
                            Tabelas Básicas
                        </div>
                    </button>

                    <button onClick={() => setView('templates')} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
                        <div className="bg-purple-50 w-16 h-16 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <MailIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Modelos de E-mail</h3>
                        <p className="text-slate-500 text-sm mb-4">Personalize o conteúdo das notificações enviadas.</p>
                        <div className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full inline-block">
                            Gerenciar Modelos
                        </div>
                    </button>



                    {canManageUsers && (
                        <button onClick={() => setView('users')} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
                            <div className="bg-orange-50 w-16 h-16 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <UserIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Gerenciar Usuários</h3>
                            <p className="text-slate-500 text-sm mb-4">Visualize usuários e reset de senhas.</p>
                            <div className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full inline-block">
                                Acesso Admin
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* Content Views */}
            {view === 'groups' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <Groups
                        groups={groups}
                        onNewGroup={onNewGroup}
                        onEditGroup={onEditGroup}
                        onDeleteGroup={onDeleteGroup}
                        onToggleGroupStatus={onToggleGroupStatus}
                    />
                </div>
            )}



            {view === 'templates' && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 h-[600px] flex overflow-hidden">
                    <div className="w-1/3 border-r border-slate-200 bg-slate-50 overflow-y-auto">
                        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 font-bold text-slate-700 text-xs uppercase flex justify-between items-center">
                            <span>Modelos</span>
                            <button onClick={handleRestoreTemplates} className="text-[10px] text-blue-600 underline">Resetar</button>
                        </div>
                        {templates.map(t => (
                            <button key={t.id} onClick={() => selectTemplate(t)} className={`w-full text-left p-4 transition-colors border-b border-slate-100 ${selectedTemplateId === t.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>
                                <div className="font-bold text-sm">{t.label}</div>
                                <div className="text-[10px] opacity-70 truncate">{t.subject}</div>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 p-6 space-y-4">
                        {selectedTemplate ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800">{selectedTemplate.label}</h4>
                                    <button onClick={handleSaveTemplate} disabled={isSavingTemplate} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest">Salvar Alterações</button>
                                </div>
                                <input type="text" value={templateForm.subject} onChange={e => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))} className="w-full rounded-lg border-slate-300 font-bold" placeholder="Assunto" />
                                <textarea value={templateForm.body} onChange={e => setTemplateForm(prev => ({ ...prev, body: e.target.value }))} className="w-full h-80 rounded-lg border-slate-300 font-mono text-xs" spellCheck={false} />
                            </>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 italic">Selecione um modelo à esquerda ou clique em Resetar.</div>}
                    </div>
                </div>
            )}

            {view === 'aux' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <AuxiliaryData onDataChange={onDataChange} />
                </div>
            )}

            {view === 'users' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <AdminUsers />
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
