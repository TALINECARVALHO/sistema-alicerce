
import React, { useMemo, useState, useEffect } from 'react';
import { Demand, Supplier } from '../types';
import PageHeader from './PageHeader';
import { SearchIcon, QAIcon } from './icons';

interface SupplierQAProps {
    demands: Demand[];
    supplier: Supplier;
    onSelectDemand: (demand: Demand) => void;
}

const SupplierQA: React.FC<SupplierQAProps> = ({ demands, supplier, onSelectDemand }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');

    const myQuestions = useMemo(() => {
        if (!supplier) return [];

        return demands.flatMap(demand => 
            demand.questions
                .filter(q => q.supplier_id === supplier.id || q.supplierName === supplier.name)
                .map(q => ({
                    ...q,
                    demandProtocol: demand.protocol,
                    demandTitle: demand.title,
                    demandStatus: demand.status,
                    demand: demand
                }))
        ).sort((a, b) => new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime());
    }, [demands, supplier]);

    // Mark answers as seen when viewing this list
    useEffect(() => {
        if (myQuestions.length > 0) {
            const answeredIds = myQuestions.filter(q => q.answer).map(q => q.id);
            if (answeredIds.length > 0) {
                try {
                    const existing = JSON.parse(localStorage.getItem('alicerce_seen_answers') || '[]');
                    // Add new IDs while keeping existing ones, ensuring uniqueness
                    const unique = Array.from(new Set([...existing, ...answeredIds]));
                    localStorage.setItem('alicerce_seen_answers', JSON.stringify(unique));
                } catch (e) {
                    console.error("Error saving seen answers", e);
                }
            }
        }
    }, [myQuestions]);

    const filteredQuestions = useMemo(() => {
        return myQuestions.filter(q => {
            const statusMatch = filter === 'all' || 
                                (filter === 'pending' && !q.answer) || 
                                (filter === 'answered' && !!q.answer);
            const searchMatch = !searchTerm ||
                                q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                q.demandProtocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                q.demandTitle.toLowerCase().includes(searchTerm.toLowerCase());
            return statusMatch && searchMatch;
        });
    }, [myQuestions, searchTerm, filter]);

    const TabButton: React.FC<{ type: 'all' | 'pending' | 'answered', label: string }> = ({ type, label }) => (
        <button
            onClick={() => setFilter(type)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                filter === type 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
            {label}
        </button>
    );

    if (!supplier) return null;

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Minhas Dúvidas"
                subtitle="Acompanhe as respostas para suas perguntas enviadas."
                showButton={false}
            />

             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 space-y-4">
                 <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-4 p-2">
                        <TabButton type="all" label="Todas" />
                        <TabButton type="pending" label="Aguardando Resposta" />
                        <TabButton type="answered" label="Respondidas" />
                    </nav>
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input 
                        type="text"
                        placeholder="Buscar por pergunta ou protocolo da demanda..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            {filteredQuestions.length > 0 ? (
                <div className="space-y-6">
                    {filteredQuestions.map(q => (
                        <div key={q.id} className="bg-white p-6 rounded-xl shadow-md border border-slate-200/80 transition-shadow hover:shadow-lg">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow pr-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <QAIcon className="w-5 h-5 text-blue-600" />
                                        <p className="text-sm font-bold text-slate-800">
                                            Minha Pergunta
                                            <span className="text-xs font-normal text-slate-500 ml-2">em {new Date(q.askedAt).toLocaleString('pt-BR')}</span>
                                        </p>
                                    </div>
                                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{q.question}"</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${q.answer ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {q.answer ? 'Respondida' : 'Aguardando'}
                                    </span>
                                </div>
                            </div>

                            {q.answer && (
                                <div className="mt-4 pl-4 border-l-4 border-green-500">
                                    <p className="text-sm font-bold text-slate-800 mb-1">
                                        Resposta Oficial
                                        <span className="text-xs font-normal text-slate-500 ml-2">por {q.answeredBy} em {new Date(q.answeredAt!).toLocaleString('pt-BR')}</span>
                                    </p>
                                    <p className="text-slate-800 whitespace-pre-wrap">{q.answer}</p>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-200/80 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Referente à Demanda</p>
                                    <button onClick={() => onSelectDemand(q.demand)} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm text-left">
                                        {q.demandProtocol} - {q.demandTitle}
                                    </button>
                                </div>
                                <button onClick={() => onSelectDemand(q.demand)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors">
                                    Ver Demanda
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="text-lg font-semibold text-slate-700">Nenhuma pergunta encontrada</h3>
                    <p className="text-slate-500 mt-1">Não há registros que correspondam aos seus filtros.</p>
                </div>
            )}
        </div>
    );
};

export default SupplierQA;
