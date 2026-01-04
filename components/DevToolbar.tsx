import { useToast } from '../contexts/ToastContext';
import React, { useState } from 'react';
import { UserRole, Profile } from '../types';
import { seedDatabase, resetDatabase } from '../services/seeder';

interface DevToolbarProps {
    onSwitchRole: (role: UserRole) => void;
    onRefresh: () => void;
    currentRole?: UserRole;
    suppliers?: any[];
}

export const DevToolbar: React.FC<DevToolbarProps> = ({ onSwitchRole, onRefresh, currentRole, suppliers = [] }) => {
    const { success, info, error: toastError } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [impersonatedId, setImpersonatedId] = useState(localStorage.getItem('dev_impersonate_supplier_id') || '');

    const handleSeed = async () => {
        if (confirm("Isso criará dados de teste no banco. Continuar?")) {
            try {
                setIsSeeding(true);
                await seedDatabase();
                onRefresh();
                success("Dados gerados com sucesso!");
            } catch (error: any) {
                console.error(error);
                toastError("Erro ao gerar dados: " + error.message);
            } finally {
                setIsSeeding(false);
            }
        }
    };

    const handleImpersonate = (id: string) => {
        if (id) localStorage.setItem('dev_impersonate_supplier_id', id);
        else localStorage.removeItem('dev_impersonate_supplier_id');
        setImpersonatedId(id);
        window.location.reload();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg z-50 hover:bg-gray-700 transition-all"
                title="Ferramentas de Desenvolvedor"
            >
                🛠️
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 p-4 rounded-xl shadow-2xl z-50 w-72 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                    🛠️ Developer Tools
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Alternar Visão (Role)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <RoleButton
                            role={UserRole.GESTOR_SUPREMO}
                            label="Gestor (Admin)"
                            active={currentRole === UserRole.GESTOR_SUPREMO}
                            onClick={onSwitchRole}
                        />
                        <RoleButton
                            role={UserRole.ALMOXARIFADO}
                            label="Almoxarifado"
                            active={currentRole === UserRole.ALMOXARIFADO}
                            onClick={onSwitchRole}
                        />
                        <RoleButton
                            role={UserRole.SECRETARIA}
                            label="Secretaria"
                            active={currentRole === UserRole.SECRETARIA}
                            onClick={onSwitchRole}
                        />
                        <RoleButton
                            role={UserRole.FORNECEDOR}
                            label="Fornecedor"
                            active={currentRole === UserRole.FORNECEDOR}
                            onClick={onSwitchRole}
                        />
                    </div>
                </div>

                {currentRole === UserRole.FORNECEDOR && (
                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Simular Login Fornecedor</p>
                        <select
                            value={impersonatedId}
                            onChange={(e) => handleImpersonate(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-gray-50 mb-2"
                        >
                            <option value="">-- Padrão (Primeiro) --</option>
                            {suppliers?.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                            ))}
                        </select>
                        {impersonatedId && <p className="text-[10px] text-blue-600 block mb-2">Simulando ID: {impersonatedId}</p>}
                    </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</p>
                        <button
                            onClick={() => {
                                const newVal = localStorage.getItem('alicerce_email_simulation_mode') !== 'true';
                                localStorage.setItem('alicerce_email_simulation_mode', String(newVal));
                                isSeeding ? null : setIsSeeding(false); // Force re-render hack
                                info(newVal ? "Modo Simulação de E-mail ATIVADO." : "Modo Simulação DESATIVADO.");
                            }}
                            className="text-[10px] text-blue-600 underline cursor-pointer"
                        >
                            {localStorage.getItem('alicerce_email_simulation_mode') === 'true' ? 'Desativar Simulação' : 'Ativar Simulação'}
                        </button>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Dados</p>
                    <button
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSeeding ? 'Gerando...' : '🌱 Gerar Dados de Teste'}
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm("⚠️ TEM CERTEZA? Isso apagará TODAS as demandas, fornecedores, propostas e itens.\n\nO banco será limpo e apenas os dados de teste serão recriados.")) {
                                try {
                                    setIsSeeding(true);
                                    await resetDatabase();
                                    onRefresh();
                                    success("Banco resetado com sucesso!");
                                } catch (e: any) {
                                    console.error(e);
                                    toastError("Erro ao resetar: " + e.message);
                                } finally {
                                    setIsSeeding(false);
                                }
                            }
                        }}

                        disabled={isSeeding}
                        className="w-full bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                        ⚠️ Resetar Banco Completo
                    </button>
                </div>
            </div>
        </div >
    );
};

const RoleButton: React.FC<{
    role: UserRole;
    label: string;
    onClick: (r: UserRole) => void;
    active: boolean;
}> = ({ role, label, onClick, active }) => (
    <button
        onClick={() => onClick(role)}
        className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${active
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
    >
        {label}
    </button>
);
