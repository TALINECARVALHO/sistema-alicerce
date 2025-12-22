import React, { useEffect, useState } from 'react';
import { AuditService, AuditLogEntry } from '../services/AuditService';
import { supabase } from '../services/supabase';
import { useToast } from '../contexts/ToastContext';
import { ShieldCheckIcon, SearchIcon, RefreshIcon } from './icons'; // Assuming these exist or similar

const AuditLogPage: React.FC = () => {
    const { error: toastError } = useToast();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // In a real app, we might need a separate fetch to get profile info if the join fails
    // or use a Supabase view.

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const data = await AuditService.getLogs();

            // Manual Join with Profiles
            const userIds = Array.from(new Set(data.map((l: any) => l.user_id).filter(Boolean)));

            let profilesMap: Record<string, any> = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, role')
                    .in('id', userIds);

                if (profiles) {
                    profiles.forEach(p => { profilesMap[p.id] = p; });
                }
            }

            const enrichedLogs = data.map((log: any) => ({
                ...log,
                user: profilesMap[log.user_id] || { full_name: 'Usuário Desconhecido', email: log.user_id }
            }));

            setLogs(enrichedLogs as any);
        } catch (e: any) {
            console.error(e);
            toastError("Erro: " + (e.message || "Falha desconhecida ao carregar logs"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in-down">
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-500/20 p-3 rounded-xl backdrop-blur-md border border-purple-500/30">
                        <ShieldCheckIcon className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                        <h4 className="font-black text-xl tracking-tight uppercase">Audit Logs</h4>
                        <p className="text-purple-200 text-xs font-medium">Registro de segurança e rastreabilidade.</p>
                    </div>
                </div>
                <button
                    onClick={loadLogs}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Atualizar"
                >
                    <RefreshIcon className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Data/Hora</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Ação</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Recurso</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">
                                            {/* @ts-ignore - handling potential missing user join */}
                                            {log.user?.full_name || 'Usuário Desconhecido'}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            {/* @ts-ignore */}
                                            {log.user?.email || log.user_id}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-bold border border-purple-100">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
                                        {log.resource}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                                        {JSON.stringify(log.details)}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogPage;
