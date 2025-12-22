

import { useToast } from '../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { Profile, UserRole, Supplier } from '../types';
import { DEPARTMENTS } from '../constants';
import Modal from './Modal';
import { UserIcon, LockClosedIcon, BuildingIcon } from './icons';

interface UserFormModalProps {
    user: Profile | null;
    suppliers: Supplier[];
    onClose: () => void;
    onSave: (user: Partial<Profile>, password?: string, supplierId?: number) => void;
    initialData?: Partial<Profile> & { supplierId?: number }; // Propriedade para pré-preenchimento
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, suppliers, onClose, onSave, initialData }) => {
    const { warning } = useToast();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.SECRETARIA);
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');

    useEffect(() => {
        if (user) {
            // Edição de usuário existente
            setFullName(user.full_name);
            setEmail(user.email || '');
            setRole(user.role as UserRole);
            setDepartment(user.department || '');
            setPassword('');

            const linkedSupplier = suppliers.find(s => s.user_id === user.id);
            if (linkedSupplier) {
                setSelectedSupplierId(linkedSupplier.id);
            } else {
                setSelectedSupplierId('');
            }
        } else if (initialData) {
            // Criação de novo usuário com dados pré-definidos (ex: via Fornecedores)
            setFullName(initialData.full_name || '');
            setEmail(initialData.email || '');
            setRole((initialData.role as UserRole) || UserRole.SECRETARIA);
            setDepartment(initialData.department || '');

            // Se for fornecedor, sugerimos a senha padrão 123456 para bater com o email de aprovação
            if (initialData.role === UserRole.FORNECEDOR) {
                setPassword('123456');
            } else {
                setPassword('');
            }

            if (initialData.supplierId) {
                setSelectedSupplierId(initialData.supplierId);
            }
        } else {
            // Criação limpa
            setFullName('');
            setEmail('');
            setRole(UserRole.SECRETARIA);
            setDepartment('');
            setPassword('');
            setSelectedSupplierId('');
        }
    }, [user, suppliers, initialData]);

    const handleSave = () => {
        if (!fullName.trim()) { warning('Nome completo é obrigatório'); return; }
        if (!user && !password.trim()) { warning('Senha é obrigatória para novos usuários'); return; }
        if (password.length > 0 && password.length < 6) { warning('A senha deve ter pelo menos 6 caracteres'); return; }

        if (role === UserRole.FORNECEDOR && !selectedSupplierId) {
            warning('Para usuários do tipo "Fornecedor", é obrigatório vincular a uma empresa.');
            return;
        }

        const payload: Partial<Profile> = {
            full_name: fullName,
            email,
            role,
            department: role === UserRole.FORNECEDOR ? undefined : department
        };

        const supplierIdToSave = role === UserRole.FORNECEDOR && selectedSupplierId ? Number(selectedSupplierId) : undefined;

        onSave(payload, password, supplierIdToSave);
    };

    const showDepartmentField = [
        UserRole.SECRETARIA,
        UserRole.ALMOXARIFADO,
        UserRole.CONTRATACOES,
        UserRole.GESTOR_SUPREMO
    ].includes(role);

    const showSupplierField = role === UserRole.FORNECEDOR;

    // Bloqueia campos se vierem no initialData (contexto de criação via fornecedor)
    const isRoleLocked = !!initialData?.role;
    const isSupplierLocked = !!initialData?.supplierId;

    return (
        <Modal isOpen={true} onClose={onClose} title={user ? 'Editar Usuário' : 'Novo Usuário do Sistema'}>
            <div className="space-y-4">
                {!user && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-blue-100 p-1 rounded-full text-blue-600">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="text-sm text-blue-800">
                                <p className="font-bold mb-1">Criação de Usuário</p>
                                <p>Preencha os dados abaixo para criar um usuário. O login será criado automaticamente no sistema.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        placeholder="Ex: João da Silva"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">E-mail (Login)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        placeholder="usuario@exemplo.com"
                        disabled={!!user}
                    />
                    {user && <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado aqui.</p>}
                </div>

                {!user && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Senha de Acesso</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-slate-300 pl-10 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                                placeholder="******"
                            />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Mínimo de 6 caracteres.</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700">Função (Role)</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        disabled={isRoleLocked}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                        <option value={UserRole.SECRETARIA}>Usuário Simples (Secretaria)</option>
                        <option value={UserRole.ALMOXARIFADO}>Almoxarifado</option>
                        <option value={UserRole.CONTRATACOES}>Gestor (Contratações)</option>
                        <option value={UserRole.GESTOR_SUPREMO}>Super Admin</option>
                        <option value={UserRole.FORNECEDOR}>Fornecedor</option>
                        <option value={UserRole.CIDADAO}>Cidadão (Visualizador)</option>
                    </select>
                </div>

                {showDepartmentField && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Secretaria / Departamento</label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        >
                            <option value="">Selecione...</option>
                            {DEPARTMENTS.map(dep => (
                                <option key={dep} value={dep}>{dep}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">Defina a qual secretaria este servidor está vinculado.</p>
                    </div>
                )}

                {showSupplierField && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Empresa Vinculada</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <BuildingIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <select
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value === '' ? '' : Number(e.target.value))}
                                disabled={isSupplierLocked}
                                className="block w-full rounded-md border-slate-300 pl-10 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
                            >
                                <option value="">Selecione uma empresa...</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>
                                        {sup.name} {sup.user_id && sup.user_id !== user?.id && !isSupplierLocked ? '(Já vinculada)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Selecione a empresa que este usuário irá gerenciar.</p>
                    </div>
                )}
            </div>
            <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancelar
                </button>
                <button type="button" onClick={handleSave} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    {user ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
            </div>
        </Modal>
    );
};

export default UserFormModal;
