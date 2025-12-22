
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import * as api from './services/api';
import { useUrlState } from './hooks/useUrlState';
import {
    UserRole,
    Page,
    Profile,
    Demand,
    Supplier,
    Group,
    CatalogItem,
    DashboardStats,
    DemandStatus,
    Item,
    Proposal,
    Question,
    SupplierStatus
} from './types';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DemandList from './components/DemandList';
import DemandDetail from './components/DemandDetail';
import DemandForm from './components/DemandForm';
import Suppliers from './components/Suppliers';
import Groups from './components/Groups';
import Catalog from './components/Catalog';
import QAPage from './components/QAPage';
import TransparencyPage from './components/TransparencyPage';
import ReportsPage from './components/ReportsPage';
import SupplierDashboard from './components/SupplierDashboard';
import SupplierData from './components/SupplierData';
import { SupplierReports } from './components/SupplierReports';
import SupplierQA from './components/SupplierQA';
import UsersPage from './components/UsersPage';
import SettingsPage from './components/SettingsPage';
import TrainingPage from './components/TrainingPage';
import LoginPage from './components/LoginPage';
import PublicHeader from './components/PublicHeader';
import { FAQSection } from './components/TransparencyPage';
import GroupFormModal from './components/GroupFormModal';
import GroupEditModal from './components/GroupEditModal';
import CatalogItemFormModal from './components/CatalogItemFormModal';
import SupplierPreRegistrationForm from './components/SupplierPreRegistrationForm';
import EmailTemplatesPage from './components/EmailTemplatesPage';
import { DevToolbar } from './components/DevToolbar';

import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuditService } from './services/AuditService';
import AuditLogPage from './components/AuditLogPage';

export const AppContent: React.FC = () => {
    const { success, error: toastError } = useToast();
    const [session, setSession] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const { page: currentPage, demandId: urlDemandId, navigate: setCurrentPage } = useUrlState('dashboard');
    const [isAppReady, setIsAppReady] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Initial Login Logging
    useEffect(() => {
        if (userProfile) {
            AuditService.logAction('LOGIN', 'AUTH', { userId: userProfile.id, role: userProfile.role });
        }
    }, [userProfile?.id]);

    // Data State
    const [demands, setDemands] = useState<Demand[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    // Navigation/UI State
    const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
    const [isCreatingDemand, setIsCreatingDemand] = useState(false);

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null);
    const [showCatalogModal, setShowCatalogModal] = useState(false);

    // Public View State
    const [publicView, setPublicView] = useState<'transparency' | 'faq' | 'supplier' | 'login'>('transparency');

    const loadPublicData = useCallback(async () => {
        try {
            const [groupsData, { data: demandsData }] = await Promise.all([
                supabase.from('groups').select('*').order('name'),
                api.fetchDemands(1, 50, { status: DemandStatus.VENCEDOR_DEFINIDO })
            ]);

            if (groupsData.data) setGroups(groupsData.data);
            if (demandsData) setDemands(demandsData);
        } catch (e) {
            console.error("Erro ao carregar dados públicos:", e);
        }
    }, []);

    const loadAuthenticatedData = useCallback(async () => {
        try {
            const [suppliersData, groupsData, catalogData] = await Promise.all([
                api.fetchSuppliers(),
                supabase.from('groups').select('*').order('name'),
                api.fetchCatalogItems()
            ]);

            setSuppliers(suppliersData);
            setGroups(groupsData.data || []);
            setCatalogItems(catalogData || []);

            const { data: demandsData } = await api.fetchDemands(1, 100);
            setDemands(demandsData);

            setStats({
                total: demandsData.length,
                open: demandsData.filter(d => d.status === DemandStatus.AGUARDANDO_PROPOSTA).length,
                drafts: demandsData.filter(d => d.status === DemandStatus.RASCUNHO).length,
                closed: demandsData.filter(d => d.status === DemandStatus.CONCLUIDA).length,
                pendingSuppliers: suppliersData.filter(s => s.status === 'Pendente').length,
                activeSuppliers: suppliersData.filter(s => s.status === 'Ativo').length,
                totalGroups: (groupsData.data || []).length
            });

        } catch (e) {
            console.error("Falha ao carregar dados autenticados", e);
        }
    }, []);

    const loadUserProfile = async (userId: string) => {
        const profile = await api.fetchUserProfile(userId);

        // Security Check: Enforce Account Activation
        if (profile && profile.active === false) {
            await supabase.auth.signOut();
            toastError("Sua conta foi desativada pelo administrador. Entre em contato para mais informações.");
            setUserProfile(null);
            setSession(null);
            setCurrentPage('dashboard');
            return;
        }

        setUserProfile(profile);
        if (profile) {
            // Only set default page if URL doesn't specify one
            const params = new URLSearchParams(window.location.search);
            if (!params.get('page')) {
                if (profile.role === UserRole.FORNECEDOR) setCurrentPage('supplier_dashboard');
                else if (profile.role === UserRole.CIDADAO) setCurrentPage('transparency');
                else setCurrentPage('dashboard');
            }

            await loadAuthenticatedData();
        }
        setIsAppReady(true);
    };

    useEffect(() => {
        loadPublicData().then(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                if (session) {
                    loadUserProfile(session.user.id);
                } else {
                    setIsAppReady(true);
                }
            });
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                loadUserProfile(session.user.id);
            } else {
                setUserProfile(null);
                setCurrentPage('dashboard');
                setPublicView('transparency');
            }
        });

        return () => subscription.unsubscribe();
    }, [loadPublicData]);

    // Restore selectedDemand from URL
    useEffect(() => {
        if (urlDemandId && demands.length > 0) {
            const demand = demands.find(d => d.id === Number(urlDemandId));
            if (demand) setSelectedDemand(demand);
        } else if (!urlDemandId) {
            setSelectedDemand(null);
        }
    }, [urlDemandId, demands]);

    const handleLogout = async () => {
        if (userProfile) {
            await AuditService.logAction('LOGOUT', 'AUTH', { userId: userProfile.id });
        }
        await supabase.auth.signOut();
    };

    const handleCreateDemand = async (demandData: any, status: DemandStatus) => {
        try {
            const protocol = `ALI.DEM.${new Date().getFullYear()}.${Math.floor(1000 + Math.random() * 9000)} `;
            const { data: newDemand, error } = await supabase.from('demands').insert([{
                ...demandData,
                protocol,
                status,
                created_at: new Date().toISOString()
            }]).select().single();

            if (error) throw error;

            if (demandData.items && newDemand) {
                const itemsToInsert = demandData.items.map((item: any) => ({
                    ...item,
                    demand_id: newDemand.id
                }));
                await supabase.from('items').insert(itemsToInsert);

                // NOTIFICAÇÃO: Se publicada, avisa fornecedores
                if (status === DemandStatus.AGUARDANDO_PROPOSTA) {
                    // Mapeia a demanda para garantir camelCase antes de notificar
                    const fullDemand = api.mapDemand({ ...newDemand, items: itemsToInsert });
                    await api.notifySuppliersNewDemand(fullDemand, groups);
                }
            }

            setIsCreatingDemand(false);
            loadAuthenticatedData();
            AuditService.logAction('CREATE_DEMAND', 'DEMAND', { demandId: newDemand.id, protocol: newDemand.protocol, title: newDemand.title });
            success("Demanda registrada com sucesso!");
        } catch (e: any) {
            toastError("Erro ao criar demanda: " + e.message);
        }
    };

    const handleStatusChange = async (demandId: number, newStatus: DemandStatus, reason?: string) => {
        try {
            const updateData: any = { status: newStatus };
            if (reason) {
                if (newStatus === DemandStatus.REPROVADA) updateData.rejection_reason = reason;
                else updateData.approval_observations = reason;
            }

            const { error } = await supabase.from('demands').update(updateData).eq('id', demandId);
            if (error) throw error;

            loadAuthenticatedData();
            if (selectedDemand && selectedDemand.id === demandId) {
                const updated = demands.find(d => d.id === demandId);
                if (updated) setSelectedDemand({ ...updated, ...updateData });
            }
            AuditService.logAction('UPDATE_STATUS', 'DEMAND', { demandId, newStatus, reason });
            success("Status da demanda atualizado com sucesso!");
        } catch (e: any) {
            toastError("Erro ao atualizar status: " + e.message);
        }
    };

    const handleDefineWinner = async (demandId: number, winner: any) => {
        try {
            // 1. Persist Winner to DB
            const { error } = await supabase.from('demands').update({
                winner: winner,
                status: DemandStatus.VENCEDOR_DEFINIDO,
                decision_date: new Date().toISOString()
            }).eq('id', demandId);

            if (error) throw error;

            // 2. Prepare Data for Notifications
            const demand = demands.find(d => d.id === demandId);
            if (!demand) return;

            // Identify Winners and Losers
            const winningSupplierNames = new Set<string>();
            const itemWinnersDetails: any[] = []; // Collect details for the report

            if (winner.mode === 'global') {
                winningSupplierNames.add(winner.supplierName);
                itemWinnersDetails.push({
                    supplierName: winner.supplierName,
                    items: demand.items, // Global winner wins all
                    totalValue: winner.totalValue
                });
            } else if (winner.mode === 'item' && winner.items) {
                winner.items.forEach((wItem: any) => {
                    winningSupplierNames.add(wItem.supplierName);
                });
                // Group items by supplier for the report
                winningSupplierNames.forEach(supName => {
                    const wonItems = winner.items.filter((i: any) => i.supplierName === supName);
                    const totalVal = wonItems.reduce((acc: number, curr: any) => acc + curr.totalValue, 0);
                    itemWinnersDetails.push({ supplierName: supName, items: wonItems, totalValue: totalVal });
                });
            }

            // Get participating suppliers (who submitted proposals)
            const participatingSuppliers = new Set(demand.proposals.map(p => p.supplierName));

            // Separate into lists
            const winnersList = Array.from(winningSupplierNames);
            const losersList = Array.from(participatingSuppliers).filter((s) => !winningSupplierNames.has(s as string));

            // Helper to find email/bank info
            const getSupplierDetails = (name: string) => suppliers.find(s => s.name === name);

            console.log(`📧 Disparando notificações de homologação para Demanda ${demand.protocol} `);

            // 3. Email 1: WINNERS (Parabéns + Próximos Passos)
            winnersList.forEach(async (winnerName) => {
                const supplierProfile = getSupplierDetails(winnerName);
                if (supplierProfile && supplierProfile.email) {
                    const conditions = winner.mode === 'item'
                        ? 'Verifique os itens adjudicados no portal.'
                        : 'Processo em fase de empenho.';

                    const { subject: winSubject, html: winHtml } = await api.getEmailContent('PROPOSAL_WINNER', {
                        '{{supplierName}}': supplierProfile.name,
                        '{{demandTitle}}': demand.title,
                        '{{protocol}}': demand.protocol,
                        '{{conditions}}': conditions
                    });

                    await api.sendEmail(supplierProfile.email, winSubject, winHtml);
                    console.log(`✅ Email VENCEDOR enviado para ${winnerName} `);
                }
            });

            // 4. Email 2: LOSERS (Agradecimento)
            losersList.forEach(async (loserName) => {
                const supplierProfile = getSupplierDetails(loserName as string);
                // Note: Ideally find proposal to get specific contact email if available, otherwise use profile
                if (supplierProfile && supplierProfile.email) {
                    const { subject: loseSubject, html: loseHtml } = await api.getEmailContent('PROPOSAL_LOSER', {
                        '{{supplierName}}': supplierProfile.name,
                        '{{demandTitle}}': demand.title,
                        '{{protocol}}': demand.protocol
                    });

                    await api.sendEmail(supplierProfile.email, loseSubject, loseHtml);
                    console.log(`☑️ Email PARTICIPANTE enviado para ${loserName} `);
                }
            });

            // 5. Email 3: SECRETARIAT (Aviso de Vencedor Definido)
            const totalValueAdjudicated = itemWinnersDetails.reduce((acc, curr) => acc + curr.totalValue, 0);
            const winnerNames = itemWinnersDetails.map(w => w.supplierName).join(', ');

            const { subject: secSubject, html: secHtml } = await api.getEmailContent('WINNER_DEFINED_SECRETARIA', {
                '{{departmentName}}': demand.requestingDepartment,
                '{{demandTitle}}': demand.title,
                '{{protocol}}': demand.protocol,
                '{{supplierName}}': winnerNames,
                '{{totalValue}}': totalValueAdjudicated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            });

            await api.sendEmail(
                demand.contactEmail,
                secSubject,
                secHtml
            );
            console.log(`📋 Email SECRETARIA(Aviso Vencedor) enviado para ${demand.contactEmail} `);


            loadAuthenticatedData();
            setSelectedDemand(null);
            AuditService.logAction('DEFINE_WINNER', 'DEMAND', { demandId, winner: winner.supplierName, totalValue: totalValueAdjudicated });
            success("Vencedor homologado! E-mails de notificação foram disparados.");
        } catch (e: any) {
            toastError("Erro ao definir vencedor: " + e.message);
        }
    };

    const handleSubmitProposal = async (demandId: number, proposal: Proposal) => {
        try {
            const { error } = await supabase.from('proposals').insert([{
                demand_id: demandId,
                supplier_id: proposal.supplierId,
                supplier_name: proposal.supplierName,
                delivery_time: proposal.deliveryTime,
                items: proposal.items,
                total_value: proposal.totalValue,
                observations: proposal.observations,
                submitted_at: new Date().toISOString()
            }]);

            if (error) throw error;
            loadAuthenticatedData();
            success("Proposta enviada com sucesso!");
        } catch (e: any) {
            toastError("Erro ao enviar proposta: " + e.message);
        }
    };

    const handleAddQuestion = async (demandId: number, question: Question) => {
        try {
            const { error } = await supabase.from('questions').insert([{
                demand_id: demandId,
                supplier_id: question.supplier_id,
                supplier_name: question.supplierName,
                question: question.question,
                asked_at: new Date().toISOString()
            }]);
            if (error) throw error;
            loadAuthenticatedData();
            success("Dúvida enviada com sucesso!");
        } catch (e: any) {
            toastError("Erro ao enviar dúvida: " + e.message);
        }
    };

    const handleAnswerQuestion = async (demandId: number, questionId: number, answer: string) => {
        try {
            const { error } = await supabase.from('questions').update({
                answer: answer,
                answered_at: new Date().toISOString(),
                answered_by: userProfile?.full_name || 'Administração'
            }).eq('id', questionId);
            if (error) throw error;
            loadAuthenticatedData();
            success("Dúvida respondida com sucesso!");
        } catch (e: any) {
            toastError("Erro ao responder dúvida: " + e.message);
        }
    };

    const renderContent = () => {
        if (!userProfile) return null;

        // Dev Mode: If role is Supplier but no linked supplier found, use the first one available for testing
        const currentSupplier = suppliers.find(s => s.user_id === userProfile.id) ||
            (process.env.NODE_ENV === 'development' && userProfile.role === UserRole.FORNECEDOR ? suppliers[0] : undefined);

        switch (currentPage) {
            case 'dashboard':
                return (
                    <Dashboard
                        stats={stats}
                        suppliers={suppliers}
                        groups={groups}
                        demands={demands}
                        onNewDemand={() => { setIsCreatingDemand(true); setCurrentPage('demands'); }}
                        onNavigateToSuppliers={(status) => { setCurrentPage('suppliers'); }}
                        onNavigateToQA={() => setCurrentPage('qa')}
                        userRole={userProfile.role as UserRole}
                    />
                );
            case 'supplier_dashboard':
                return (
                    <SupplierDashboard
                        demands={demands}
                        supplier={currentSupplier!}
                        groups={groups}
                        onSelectDemand={(d) => setCurrentPage('demands', d.id)}
                        onViewOpportunities={() => setCurrentPage('demands')}
                        onViewQA={() => setCurrentPage('supplier_qa')}
                        onViewSupplierData={() => setCurrentPage('supplier_data')}
                    />
                );
            case 'demands':
                if (selectedDemand) {
                    return (
                        <DemandDetail
                            demand={selectedDemand}
                            groups={groups}
                            suppliers={suppliers}
                            userRole={userProfile.role as UserRole}
                            currentSupplier={currentSupplier}
                            catalogItems={catalogItems}
                            onBack={() => setCurrentPage('demands')}
                            onSubmitProposal={handleSubmitProposal}
                            onAddQuestion={handleAddQuestion}
                            onAnswerQuestion={handleAnswerQuestion}
                            onDefineWinner={handleDefineWinner}
                            onStatusChange={handleStatusChange}
                            onRejectDemand={(id, reason) => handleStatusChange(id, DemandStatus.REPROVADA, reason)}
                        />
                    );
                }
                if (isCreatingDemand) {
                    return (
                        <DemandForm
                            groups={groups}
                            catalogItems={catalogItems}
                            userProfile={userProfile}
                            onSubmit={handleCreateDemand}
                            onCancel={() => setIsCreatingDemand(false)}
                            onDeleteCatalogItem={(id) => setCatalogItems(prev => prev.filter(i => i.id !== id))}
                        />
                    );
                }
                return (
                    <DemandList
                        groups={groups}
                        suppliers={suppliers}
                        userRole={userProfile.role as UserRole}
                        onSelectDemand={(d) => setCurrentPage('demands', d.id)}
                        onNewDemand={() => setIsCreatingDemand(true)}
                        currentSupplier={currentSupplier}
                    />
                );
            case 'suppliers':
                return (
                    <Suppliers
                        suppliers={suppliers}
                        demands={demands}
                        groups={groups}
                        onNewSupplier={() => { }}
                        onDeleteSupplier={async (id) => {
                            try {
                                await api.deleteSupplier(id);
                                success("Fornecedor excluído com sucesso.");
                                loadAuthenticatedData();
                            } catch (e: any) {
                                toastError("Erro ao excluir fornecedor: " + (e.message || "Erro desconhecido."));
                            }
                        }}
                        onUpdateStatus={async (id, status, reason) => {
                            try {
                                if (status === 'Reprovado' && reason) {
                                    await api.rejectSupplier(id, reason);
                                } else if (status === 'Ativo') {
                                    const supplier = suppliers.find(s => s.id === id);
                                    if (supplier) {
                                        if (supplier.user_id) {
                                            await supabase.from('suppliers').update({
                                                status: 'Ativo',
                                                rejection_reason: null
                                            }).eq('id', id);
                                        } else {
                                            await api.approveSupplierWorkflow(supplier);
                                        }
                                    }
                                } else {
                                    await supabase.from('suppliers').update({ status, rejection_reason: reason }).eq('id', id);
                                }
                                loadAuthenticatedData();
                                AuditService.logAction('UPDATE_SUPPLIER_STATUS', 'SUPPLIER', { supplierId: id, status, reason });
                                success(`Fornecedor ${status === 'Ativo' ? 'aprovado' : 'reprovado'} com sucesso!`);
                            } catch (e: any) {
                                toastError("Erro ao atualizar status: " + (e.message || "Falha técnica"));
                            }
                        }}
                        onUpdateSupplier={async (supplier, files) => {
                            try {
                                await api.updateSupplier(supplier, files);
                                await loadAuthenticatedData();
                                AuditService.logAction('UPDATE_SUPPLIER', 'SUPPLIER', { supplierId: supplier.id, name: supplier.name });
                                success("Fornecedor atualizado com sucesso!");
                            } catch (e: any) {
                                toastError("Erro ao atualizar fornecedor: " + e.message);
                            }
                        }}
                        userRole={userProfile.role as UserRole}
                    />
                );
            case 'groups':
                return (
                    <Groups
                        groups={groups}
                        onNewGroup={() => setShowGroupModal(true)}
                        onEditGroup={setEditingGroup}
                        onDeleteGroup={async (id) => { if (confirm("Deseja excluir este grupo?")) { await supabase.from('groups').delete().eq('id', id); loadAuthenticatedData(); } }}
                        onToggleGroupStatus={async (id) => { const g = groups.find(g => g.id === id); if (g) await supabase.from('groups').update({ isActive: !g.isActive }).eq('id', id); loadAuthenticatedData(); }}
                    />
                );
            case 'catalog':
                return (
                    <Catalog
                        items={catalogItems}
                        groups={groups}
                        userRole={userProfile.role as UserRole}
                        onNewItem={() => setShowCatalogModal(true)}
                        onEditItem={(item) => { setEditingCatalogItem(item); setShowCatalogModal(true); }}
                        onDeleteItem={async (id) => {
                            if (confirm("Deseja excluir este item?")) {
                                try {
                                    await api.deleteCatalogItem(id);
                                    await loadAuthenticatedData();
                                    success("Item excluído com sucesso.");
                                } catch (e) {
                                    toastError("Erro ao excluir item. Ele pode estar vinculado a uma demanda existente.");
                                }
                            }
                        }}
                    />
                );
            case 'qa': return <QAPage demands={demands} onSelectDemand={(d) => setCurrentPage('demands', d.id)} onAnswerQuestion={handleAnswerQuestion} />;
            case 'transparency':
                if (selectedDemand) {
                    return (
                        <DemandDetail
                            demand={selectedDemand}
                            groups={groups}
                            suppliers={suppliers}
                            userRole={userProfile.role as UserRole}
                            onBack={() => setSelectedDemand(null)}
                            onSubmitProposal={async () => { }}
                            onAddQuestion={() => { }}
                            onAnswerQuestion={() => { }}
                            onDefineWinner={async () => { }}
                            onStatusChange={() => { }}
                            onRejectDemand={() => { }}
                        />
                    );
                }
                return <TransparencyPage demands={demands} suppliers={suppliers} groups={groups} isPublic={true} onSelectDemand={setSelectedDemand} />;
            case 'reports': return <ReportsPage demands={demands} suppliers={suppliers} groups={groups} />;
            case 'users': return <UsersPage />;
            case 'settings':
                return (
                    <SettingsPage
                        groups={groups}
                        catalogItems={catalogItems}
                        userRole={userProfile.role as UserRole}
                        onNavigate={setCurrentPage}
                        onNewGroup={() => setShowGroupModal(true)}
                        onEditGroup={setEditingGroup}
                        onDeleteGroup={async (id) => { if (confirm("Deseja excluir este grupo?")) { await supabase.from('groups').delete().eq('id', id); loadAuthenticatedData(); } }}
                        onToggleGroupStatus={async (id) => { const g = groups.find(g => g.id === id); if (g) await supabase.from('groups').update({ isActive: !g.isActive }).eq('id', id); loadAuthenticatedData(); }}
                        onNewCatalogItem={() => setShowCatalogModal(true)}
                        onEditCatalogItem={(item) => { setEditingCatalogItem(item); setShowCatalogModal(true); }}
                        onDeleteCatalogItem={async (id) => {
                            if (confirm("Deseja excluir este item?")) {
                                try {
                                    await api.deleteCatalogItem(id);
                                    await loadAuthenticatedData();
                                    success("Item excluído com sucesso.");
                                } catch (e) {
                                    toastError("Erro ao excluir item. Ele pode estar vinculado a uma demanda existente.");
                                }
                            }
                        }}
                    />
                );
            case 'training': return <TrainingPage />;
            case 'supplier_data':
                return <SupplierData supplier={currentSupplier!} groups={groups} onUpdateSupplier={async (s, files) => { await api.updateSupplier(s, files); loadAuthenticatedData(); }} />;
            case 'supplier_reports':
                return <SupplierReports demands={demands} supplier={currentSupplier!} />;
            case 'supplier_qa':
                return <SupplierQA demands={demands} supplier={currentSupplier!} onSelectDemand={(d) => setCurrentPage('demands', d.id)} />;
            case 'audit-logs':
                return <AuditLogPage />;

            default: return <div>Página em desenvolvimento</div>;
        }
    };

    if (!isAppReady) return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Carregando Alicerce...</p>
            </div>
        </div>
    );

    if (!session) {
        // Login page should not have the public header
        if (publicView === 'login') {
            return (
                <div className="min-h-screen bg-slate-50">
                    <LoginPage onBack={() => setPublicView('transparency')} />
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <PublicHeader currentView={publicView} onNavigate={setPublicView} />
                <main className="flex-grow container mx-auto px-4 py-8">
                    {publicView === 'transparency' && (
                        <>
                            {selectedDemand ? (
                                <div className="animate-fade-in-down">
                                    <DemandDetail
                                        demand={selectedDemand}
                                        groups={groups}
                                        suppliers={suppliers}
                                        userRole={UserRole.CIDADAO}
                                        onBack={() => setSelectedDemand(null)}
                                        onSubmitProposal={async () => { }}
                                        onAddQuestion={() => { }}
                                        onAnswerQuestion={() => { }}
                                        onDefineWinner={async () => { }}
                                        onStatusChange={() => { }}
                                        onRejectDemand={() => { }}
                                    />
                                </div>
                            ) : (
                                <TransparencyPage demands={demands} suppliers={suppliers} groups={groups} isPublic={true} onSelectDemand={setSelectedDemand} />
                            )}
                        </>
                    )}
                    {publicView === 'faq' && <FAQSection />}
                    {publicView === 'supplier' && (
                        <SupplierPreRegistrationForm
                            groups={groups}
                            isPublicView={true}
                            onLogin={() => setPublicView('login')}
                            onSubmit={async (data, files) => {
                                try {
                                    await api.createSupplier(data as any, files);
                                    success("Cadastro enviado com sucesso! Aguarde a aprovação.");
                                } catch (e: any) {
                                    toastError("Erro ao enviar cadastro: " + (e.message || "Falha na conexão"));
                                    throw e;
                                }
                            }}
                            onCancel={() => setPublicView('transparency')}
                        />
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar
                currentPage={currentPage}
                setCurrentPage={(page) => {
                    if (currentPage !== page) {
                        setSelectedDemand(null);
                        setIsCreatingDemand(false);
                    }
                    setCurrentPage(page);
                }}
                userProfile={userProfile}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    userProfile={userProfile}
                    onLogout={handleLogout}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth custom-scrollbar">
                    {renderContent()}
                </main>
            </div>
            {/* Developer Toolbar */}
            {process.env.NODE_ENV === 'development' && userProfile && (
                <DevToolbar
                    currentRole={userProfile.role}
                    onSwitchRole={(role) => setUserProfile({ ...userProfile, role })}
                    onRefresh={loadAuthenticatedData}
                />
            )}

            {/* Global Admin Modals */}
            {showGroupModal && (
                <GroupFormModal
                    onClose={() => setShowGroupModal(false)}
                    onSave={async (g) => { await supabase.from('groups').insert([g]); setShowGroupModal(false); loadAuthenticatedData(); success("Grupo salvo com sucesso!"); }}
                />
            )}
            {editingGroup && (
                <GroupEditModal
                    group={editingGroup}
                    onClose={() => setEditingGroup(null)}
                    onSave={async (g) => { await supabase.from('groups').update(g).eq('id', g.id); setEditingGroup(null); loadAuthenticatedData(); success("Grupo atualizado com sucesso!"); }}
                />
            )}
            {showCatalogModal && (
                <CatalogItemFormModal
                    item={editingCatalogItem}
                    groups={groups}
                    onClose={() => { setShowCatalogModal(false); setEditingCatalogItem(null); }}
                    onSave={async (item) => {
                        try {
                            if (editingCatalogItem) await api.updateCatalogItem(item);
                            else await api.createCatalogItem(item);
                            setShowCatalogModal(false);
                            setEditingCatalogItem(null);
                            await loadAuthenticatedData();
                            success("Item salvo com sucesso!");
                        } catch (e: any) {
                            toastError("Erro ao salvar item: " + e.message);
                        }
                    }}
                />
            )}
            <style>{`
    .custom - scrollbar:: -webkit - scrollbar { width: 6px; }
                .custom - scrollbar:: -webkit - scrollbar - track { background: transparent; }
                .custom - scrollbar:: -webkit - scrollbar - thumb { background: #e2e8f0; border - radius: 10px; }
                .custom - scrollbar:: -webkit - scrollbar - thumb:hover { background: #cbd5e1; }
`}</style>
        </div>
    );
};

export const App = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);
