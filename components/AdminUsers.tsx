
import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { Profile, UserRole } from '../types';
import { UserIcon, KeyIcon, SearchIcon, BuildingIcon, ShieldCheckIcon, RefreshIcon } from './icons';
import Modal from './Modal';

const AdminUsers: React.FC = () => {
    const { success, error: toastError } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [resettingUser, setResettingUser] = useState<Profile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.fetchProfiles();
            setProfiles(data);
        } catch (e: any) {
            toastError("Erro ao carregar usuários: " + api.formatError(e));
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleResetPassword = async () => {
        if (!resettingUser) return;
        setIsProcessing(true);
        try {
            const result = await api.resetSystemUserPassword(resettingUser.id, resettingUser.email, resettingUser.full_name);
            if (result.success) {
                success(`Senha resetada para ${resettingUser.full_name}. E-mail enviado!`);
                setResettingUser(null);
            } else {
                toastError(result.message);
            }
        } catch (e: any) {
            toastError("Falha ao resetar senha: " + api.formatError(e));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-grow max-w-md w-full">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg text-blue-800 text-xs font-bold border border-blue-100">
                    {filteredProfiles.length} Usuários
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Função</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Carregando...</td></tr>
                        ) : filteredProfiles.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>
                        ) : (
                            filteredProfiles.map(profile => (
                                <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900">{profile.full_name || 'Sem nome'}</div>
                                                <div className="text-xs text-slate-500">{profile.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-slate-600 gap-2">
                                            <BuildingIcon className="w-4 h-4 text-slate-300" />
                                            {profile.department || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.role === UserRole.GESTOR_SUPREMO ? 'bg-purple-100 text-purple-800' :
                                            profile.role === UserRole.CONTRATACOES ? 'bg-blue-100 text-blue-800' :
                                                profile.role === UserRole.SECRETARIA ? 'bg-orange-100 text-orange-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {profile.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setResettingUser(profile)}
                                            className="text-slate-400 hover:text-blue-600 transition-colors tooltip"
                                            title="Resetar Senha"
                                        >
                                            <KeyIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {resettingUser && (
                <Modal isOpen={true} onClose={() => setResettingUser(null)} title="Confirmar Reset de Senha">
                    <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-4">
                            <div className="text-yellow-600 bg-yellow-100 h-fit p-2 rounded-lg">
                                <KeyIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-900">Atenção</h4>
                                <p className="text-sm text-yellow-800 mt-1">
                                    Você está prestes a redefinir a senha do usuário <b>{resettingUser.full_name}</b>.
                                </p>
                                <p className="text-sm text-yellow-800 mt-2">
                                    Uma nova senha aleatória será gerada e enviada para <b>{resettingUser.email}</b>.
                                    A senha atual será invalidada imediatamente.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setResettingUser(null)}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={isProcessing}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                {isProcessing ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <KeyIcon className="w-4 h-4" />}
                                Confirmar Reset
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminUsers;
