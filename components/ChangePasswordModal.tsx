
import React, { useState } from 'react';
import Modal from './Modal';
import * as api from '../services/api';

interface ChangePasswordModalProps {
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);
        try {
            await api.updateCurrentUserPassword(password);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar a senha.');
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <Modal isOpen={true} onClose={onClose} title="Senha Alterada">
                <div className="text-center py-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Sucesso!</h3>
                    <p className="text-sm text-slate-500 mt-2">Sua senha foi atualizada com sucesso.</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="Alterar Senha">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Nova Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        placeholder="Mínimo 6 caracteres"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        placeholder="Repita a senha"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 p-3 rounded-md border border-red-200 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-200">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 mr-3">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Salvando...' : 'Alterar Senha'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;
