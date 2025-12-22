
import { useToast } from '../contexts/ToastContext';
import React, { useState, useEffect, useMemo } from 'react';
import { Profile, UserRole, Supplier } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import { SearchIcon, CogIcon, TrashIcon, BuildingIcon, UserIcon, ShieldCheckIcon } from './icons';
import UserFormModal from './UserFormModal';

type Tab = 'servidores' | 'fornecedores';

const UsersPage: React.FC = () => {
    const { warning } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('servidores');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Pega o usuário atual para verificação de permissões
            const { data: { user } } = await supabase.auth.getUser();
            let currentProfile = null;
            if (user) {
                currentProfile = await api.fetchUserProfile(user.id);
                setCurrentUserProfile(currentProfile);
            }

            const [profilesData, suppliersData] = await Promise.all([
                api.fetchProfiles(),
                api.fetchSuppliers()
            ]);
            setProfiles(profilesData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Erro ao carregar lista de usuários. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveUser = async (userData: Partial<Profile>, password?: string, supplierId?: number) => {
        setError(null);
        try {
            let savedUser: Profile;

            if (editingUser) {
                // Update existing profile
                savedUser = await api.updateProfile({ ...editingUser, ...userData });
                setProfiles(prev => prev.map(p => p.id === savedUser.id ? savedUser : p));
                setEditingUser(null);
            } else {
                // Creating a new user profile + Auth User
                if (!password) {
                    setError("Senha é obrigatória para novos usuários.");
                    return;
                }
                const result = await api.createSystemUser(userData, password);

                if (!result) {
                    // Do not throw, set error message
                    setError("Falha na criação do usuário: O sistema não retornou dados. Verifique a automação (Edge Function).");
                    return;
                }

                savedUser = result;
                setProfiles(prev => [...prev, savedUser]);
                setIsCreating(false);
            }

            // Se for fornecedor e houver um supplierId selecionado, faz o vínculo
            if (supplierId && userData.role === UserRole.FORNECEDOR) {
                await api.linkUserToSupplier(savedUser.id, supplierId);
                // Atualiza a lista de fornecedores para refletir o novo vínculo visualmente
                const updatedSuppliers = await api.fetchSuppliers();
                setSuppliers(updatedSuppliers);
            }

            // Optional: Reload to ensure consistency
            // await loadData(); 
        } catch (err: any) {
            console.error('Error saving user:', err);
            // Extract the actual message from the error object
            const errorMessage = err.message || err.error_description || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setError(`Erro ao salvar usuário: ${errorMessage}`);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (currentUserProfile?.role !== UserRole.GESTOR_SUPREMO) {
            warning("Apenas o Gestor Supremo tem permissão para excluir usuários.");
            return;
        }

        if (currentUserProfile?.id === id) {
            warning("Você não pode excluir seu próprio usuário.");
            return;
        }

        if (!window.confirm('Tem certeza? Esta ação removerá o acesso do usuário ao sistema.')) return;

        setError(null);
        try {
            await api.deleteSystemUser(id);
            // Atualiza a lista localmente para feedback instantâneo
            setProfiles(prev => prev.filter(p => p.id !== id));
            // Recarrega fornecedores para garantir consistência
            const suppliersData = await api.fetchSuppliers();
            setSuppliers(suppliersData);
        } catch (err: any) {
            console.error('Error deleting user:', err);
            setError(err.message || 'Erro ao excluir usuário.');
        }
    };

    const getLinkedSupplierName = (userId: string) => {
        const supplier = suppliers.find(s => s.user_id === userId);
        return supplier ? supplier.name : null;
    };

    const filteredProfiles = useMemo(() => {
        const preFiltered = profiles.filter(p => {
            if (activeTab === 'servidores') return p.role !== UserRole.FORNECEDOR;
            if (activeTab === 'fornecedores') return p.role === UserRole.FORNECEDOR;
            return true;
        });

        return preFiltered.filter(p => {
            const matchTerm = searchTerm.toLowerCase();
            const supplierName = activeTab === 'fornecedores' ? getLinkedSupplierName(p.id)?.toLowerCase() : '';

            return p.full_name?.toLowerCase().includes(matchTerm) ||
                p.email?.toLowerCase().includes(matchTerm) ||
                p.department?.toLowerCase().includes(matchTerm) ||
                p.role?.toLowerCase().includes(matchTerm) ||
                (supplierName && supplierName.includes(matchTerm));
        });
    }, [profiles, searchTerm, activeTab, suppliers]);

    const getRoleLabel = (role: string) => {
        if (role === UserRole.GESTOR_SUPREMO || role === 'Gestor Supremo') return 'Super Admin';
        switch (role) {
            case UserRole.CONTRATACOES: return 'Gestor (Contratações)';
            case UserRole.ALMOXARIFADO: return 'Almoxarifado';
            case UserRole.SECRETARIA: return 'Usuário Simples';
            case UserRole.FORNECEDOR: return 'Fornecedor';
            case UserRole.CIDADAO: return 'Cidadão';
            default: return role;
        }
    };

    const handleToggleStatus = async (profile: Profile) => {
        if (!isSuperAdmin) return;

        // Se for undefined ou true, o novo estado será false (desativar). Se for false, será true (ativar).
        const newStatus = profile.active === false ? true : false;

        try {
            // Optimistic update
            setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, active: newStatus } : p));

            await api.updateProfile({ ...profile, active: newStatus });
        } catch (err: any) {
            console.error("Erro ao atualizar status:", err);
            setError("Erro ao atualizar status do usuário.");
            // Revert on error
            setProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
        }
    };

    const isSuperAdmin = currentUserProfile?.role === UserRole.GESTOR_SUPREMO;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900">Gestão de Usuários</h1>
                    <p className="mt-1.5 text-slate-600">Gerencie acessos do sistema e contas de fornecedores.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setError(null);
                            setIsCreating(true);
                        }}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                    >
                        <UserIcon className="h-5 w-5" />
                        <span>Novo Usuário</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm mb-6">
                    <div className="flex">
                        <div className="ml-3 w-full overflow-hidden">
                            <h3 className="text-sm font-medium text-red-800">Atenção - Erro</h3>
                            <div className="mt-2 text-xs text-slate-800 bg-slate-100 p-3 rounded border border-slate-300 font-mono whitespace-pre overflow-x-auto">
                                {error}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 space-y-4">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('servidores')}
                            className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'servidores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            <UserIcon className="w-4 h-4" />
                            Servidores da Prefeitura
                        </button>
                        <button
                            onClick={() => setActiveTab('fornecedores')}
                            className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'fornecedores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            <BuildingIcon className="w-4 h-4" />
                            Fornecedores
                        </button>
                    </nav>
                </div>

                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={activeTab === 'servidores' ? "Buscar por nome, email ou secretaria..." : "Buscar por nome, email ou empresa..."}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
                <div className="p-5 border-b border-slate-200/80 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">
                        {activeTab === 'servidores' ? 'Lista de Servidores' : 'Lista de Usuários de Fornecedores'}
                    </h3>
                    {isSuperAdmin && (
                        <span className="flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            <ShieldCheckIcon className="w-3 h-3 mr-1" />
                            Modo Super Admin
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 border-b border-slate-200/80">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome / Email</th>
                                {activeTab === 'servidores' ? (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Secretaria</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Função</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa Vinculada</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Carregando usuários...</td>
                                </tr>
                            ) : filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Nenhum usuário encontrado.</td>
                                </tr>
                            ) : (
                                filteredProfiles.map((profile) => {
                                    const linkedSupplier = getLinkedSupplierName(profile.id);

                                    return (
                                        <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${activeTab === 'servidores' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {profile.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">{profile.email}</div>
                                                        <div className="text-xs text-slate-500">{profile.full_name}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {activeTab === 'servidores' ? (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {profile.department || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${profile.role === UserRole.GESTOR_SUPREMO ? 'bg-red-100 text-red-800' :
                                                                profile.role === UserRole.SECRETARIA ? 'bg-slate-100 text-slate-800' :
                                                                    'bg-blue-100 text-blue-800'}`}>
                                                            {getRoleLabel(profile.role)}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {linkedSupplier ? (
                                                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                                <BuildingIcon className="w-4 h-4 text-slate-400" />
                                                                {linkedSupplier}
                                                            </div>
                                                        ) : (
                                                            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs">Vínculo Pendente</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                                            {UserRole.FORNECEDOR}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {/* Botão de Ativar/Desativar - Apenas Super Admin */}
                                                {isSuperAdmin && profile.id !== currentUserProfile?.id && (
                                                    <button
                                                        onClick={() => handleToggleStatus(profile)}
                                                        className={`mx-2 p-1 rounded-full transition-colors ${profile.active !== false ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                        title={profile.active !== false ? "Usuário Ativo (Clique para desativar)" : "Usuário Inativo (Clique para ativar)"}
                                                    >
                                                        {profile.active !== false ? (
                                                            <div className="w-8 h-4 bg-green-500 rounded-full relative flex items-center transition-colors">
                                                                <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 shadow-sm"></div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-4 bg-slate-300 rounded-full relative flex items-center transition-colors">
                                                                <div className="w-3 h-3 bg-white rounded-full absolute left-0.5 shadow-sm"></div>
                                                            </div>
                                                        )}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setError(null);
                                                        setEditingUser(profile);
                                                    }}
                                                    className="text-slate-400 hover:text-blue-600 mx-2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                                                    title="Editar Usuário"
                                                >
                                                    <CogIcon className="w-5 h-5" />
                                                </button>
                                                {/* Política de Segurança: Apenas Super Admin vê o botão de excluir */}
                                                {isSuperAdmin && profile.id !== currentUserProfile?.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(profile.id)}
                                                        className="text-slate-400 hover:text-red-600 mx-2 p-1 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Excluir Usuário (Acesso Restrito)"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {(isCreating || editingUser) && (
                <UserFormModal
                    user={editingUser}
                    suppliers={suppliers}
                    onClose={() => {
                        setIsCreating(false);
                        setEditingUser(null);
                        setError(null);
                    }}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

export default UsersPage;
