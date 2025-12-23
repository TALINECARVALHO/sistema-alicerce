
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import * as api from '../services/api';
import { MailIcon, LockClosedIcon, AlicerceIcon, BackIcon, ChartBarIcon } from './icons';

interface LoginPageProps {
    onBack?: () => void;
    onPublicAccess?: () => void;
    title?: string;
    subtitle?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onPublicAccess, title = "Acesse sua Conta", subtitle = "Entre com suas credenciais para continuar" }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoverySent, setRecoverySent] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.error_description || error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        } finally {
            setLoading(false);
        }
    };

    const handleRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await api.requestPasswordReset(email);
            if (!result.success) {
                throw new Error(result.message);
            }
            setRecoverySent(true);
        } catch (error: any) {
            setError(error.message || 'Erro ao enviar solicitação de recuperação.');
        } finally {
            setLoading(false);
        }
    };

    if (showRecovery) {
        return (
            <div className="flex items-center justify-center p-4 h-full">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-900 py-6 px-6 text-center relative overflow-hidden">
                        <div className="mx-auto bg-white/10 p-3 rounded-xl inline-flex items-center justify-center mb-3 ring-1 ring-white/20 shadow-lg backdrop-blur-sm">
                            <LockClosedIcon className="h-8 w-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">Recuperar Senha</h1>
                        <p className="mt-1 text-blue-200 text-sm font-medium">Sistema Alicerce</p>
                    </div>

                    <div className="px-8 py-8 bg-white">
                        {recoverySent ? (
                            <div className="text-center">
                                <div className="bg-green-50 p-6 rounded-xl border border-green-100 mb-6">
                                    <h3 className="text-green-900 font-bold mb-2">✅ Solicitação Enviada!</h3>
                                    <p className="text-sm text-green-700 leading-relaxed">
                                        Sua solicitação de reset de senha foi enviada ao administrador do sistema.
                                    </p>
                                    <p className="text-sm text-green-700 mt-4">
                                        Você receberá um email com suas novas credenciais em breve.
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setShowRecovery(false); setRecoverySent(false); }}
                                    className="w-full py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all"
                                >
                                    Voltar para Login
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
                                    <h3 className="text-blue-900 font-bold mb-2">Esqueceu sua senha?</h3>
                                    <p className="text-sm text-blue-700 leading-relaxed">
                                        Digite seu email abaixo. Enviaremos uma solicitação ao administrador para resetar sua senha.
                                    </p>
                                </div>

                                <form onSubmit={handleRecovery} className="space-y-4">
                                    <div>
                                        <label htmlFor="recovery-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Email</label>
                                        <input
                                            id="recovery-email"
                                            type="email"
                                            required
                                            className="block w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 py-2.5 text-slate-900 placeholder-slate-400 sm:text-sm"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-md">
                                            <p className="text-xs text-red-700">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-bold hover:bg-blue-700 disabled:bg-blue-400 transition-all"
                                    >
                                        {loading ? 'Enviando...' : 'Solicitar Reset de Senha'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowRecovery(false)}
                                        className="w-full py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all"
                                    >
                                        Voltar para Login
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4 h-full">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                {/* Header Section Compacto */}
                <div className="bg-slate-900 py-6 px-6 text-center relative overflow-hidden">
                    <div className="mx-auto bg-white/10 p-3 rounded-xl inline-flex items-center justify-center mb-3 ring-1 ring-white/20 shadow-lg backdrop-blur-sm">
                        <AlicerceIcon className="h-8 w-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Sistema Alicerce</h1>
                    <p className="mt-1 text-blue-200 text-sm font-medium">Gestão Municipal Inteligente</p>
                </div>

                {/* Form Section Compacto */}
                <div className="px-8 py-6 bg-white">
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                        <p className="text-slate-500 mt-0.5 text-xs">{subtitle}</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email-address" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Email</label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-lg border-slate-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2.5 text-slate-900 placeholder-slate-400 sm:text-sm"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Senha</label>
                                <button type="button" onClick={() => { setError(null); setShowRecovery(true); }} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-lg border-slate-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2.5 text-slate-900 placeholder-slate-400 sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-md">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-xs text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95"
                            >
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </form>

                    {onBack && (
                        <div className="mt-5 text-center">
                            <button
                                onClick={onBack}
                                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 w-full"
                            >
                                <BackIcon className="w-3.5 h-3.5" /> Voltar ao Início
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
