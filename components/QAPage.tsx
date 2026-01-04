
import React, { useMemo, useState } from 'react';
import { Demand, Question } from '../types';
import PageHeader from './PageHeader';
import { SearchIcon } from './icons';

interface QAPageProps {
    demands: Demand[];
    onSelectDemand: (demand: Demand) => void;
    onAnswerQuestion: (demandId: number, questionId: number, answer: string) => void;
}

// Helper function to safely format dates
const formatDate = (dateValue: string | null | undefined): string => {
    if (!dateValue) return 'Data não disponível';
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        return 'Data inválida';
    }
};

const QACard: React.FC<{
    question: Question & { demandId: number; demandProtocol: string; demandTitle: string };
    onSelectDemand: () => void;
    onAnswer: (questionId: number, answer: string) => void;
}> = ({ question, onSelectDemand, onAnswer }) => {
    const [answerText, setAnswerText] = useState('');

    const handleAnswerSubmit = () => {
        if (answerText.trim()) {
            onAnswer(question.id, answerText);
            setAnswerText('');
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200/80">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        <span className="font-bold text-blue-600">Fornecedor {question.supplierName?.charAt(0) || '?'}...</span> perguntou em {formatDate(question.askedAt || (question as any).asked_at)}
                    </p>
                    <p className="mt-2 text-slate-700">{question.question}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${question.answer ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {question.answer ? 'Respondida' : 'Pendente'}
                </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/80">
                <p className="text-xs text-slate-500">
                    Referente à demanda: <button onClick={onSelectDemand} className="font-semibold text-blue-600 hover:underline">{question.demandProtocol} - {question.demandTitle}</button>
                </p>
            </div>

            {question.answer ? (
                <div className="mt-4 pt-3 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-800">
                        <span className="font-bold text-green-600">{question.answeredBy || (question as any).answered_by || 'Administração'}</span> respondeu em {formatDate(question.answeredAt || (question as any).answered_at)}:
                    </p>
                    <p className="mt-2 text-slate-700 whitespace-pre-wrap">{question.answer}</p>
                </div>
            ) : (
                <div className="mt-4 pt-3 border-t border-slate-200">
                    <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Digite a resposta oficial aqui..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                    />
                    <button onClick={handleAnswerSubmit} className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors">
                        Responder
                    </button>
                </div>
            )}
        </div>
    );
};

const QAPage: React.FC<QAPageProps> = ({ demands, onSelectDemand, onAnswerQuestion }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');

    const allQuestions = useMemo(() => {
        return demands.flatMap(demand =>
            demand.questions.map(q => ({
                ...q,
                demandId: demand.id,
                demandProtocol: demand.protocol,
                demandTitle: demand.title
            }))
        ).sort((a, b) => new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime());
    }, [demands]);

    const filteredQuestions = useMemo(() => {
        return allQuestions.filter(q => {
            const statusMatch = filter === 'all' ||
                (filter === 'pending' && !q.answer) ||
                (filter === 'answered' && !!q.answer);
            const searchMatch = !searchTerm ||
                q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.demandProtocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
            return statusMatch && searchMatch;
        });
    }, [allQuestions, searchTerm, filter]);

    const handleAnswer = (questionId: number, answer: string) => {
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
            onAnswerQuestion(question.demandId, questionId, answer);
        }
    };

    const TabButton: React.FC<{ type: 'all' | 'pending' | 'answered', label: string }> = ({ type, label }) => (
        <button
            onClick={() => setFilter(type)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === type
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-200'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Perguntas e Respostas"
                subtitle="Gerencie todas as dúvidas de fornecedores em um só lugar"
                showButton={false}
            />

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 space-y-4">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-4 p-2">
                        <TabButton type="all" label="Todas" />
                        <TabButton type="pending" label="Pendentes" />
                        <TabButton type="answered" label="Respondidas" />
                    </nav>
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por pergunta, protocolo ou fornecedor..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            {filteredQuestions.length > 0 ? (
                <div className="space-y-6">
                    {filteredQuestions.map(q => (
                        <QACard
                            key={q.id}
                            question={q}
                            onSelectDemand={() => {
                                const demand = demands.find(d => d.id === q.demandId);
                                if (demand) onSelectDemand(demand);
                            }}
                            onAnswer={handleAnswer}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="text-lg font-semibold text-slate-700">Nenhuma pergunta encontrada</h3>
                    <p className="text-slate-500 mt-1">Não há perguntas que correspondam aos filtros selecionados.</p>
                </div>
            )}
        </div>
    );
};

export default QAPage;
