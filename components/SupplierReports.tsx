
import { useToast } from '../contexts/ToastContext';
import React, { useMemo, useState } from 'react';
import { Demand, Supplier, DemandStatus } from '../types';
import PageHeader from './PageHeader';
import { CalendarIcon, DollarIcon, QAIcon, CheckCircleIcon, ClockIcon, ChartBarIcon, DownloadIcon } from './icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface SupplierReportsProps {
    demands: Demand[];
    supplier: Supplier;
}

export const SupplierReports: React.FC<SupplierReportsProps> = ({ demands, supplier }) => {
    const { error: toastError } = useToast();
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const toggleExpand = (id: number) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    // Process Data
    const myProposalsData = useMemo(() => {
        if (!supplier) return [];

        return demands.map(demand => {
            const myProposal = demand.proposals.find(p => p.supplierName === supplier.name);
            if (!myProposal) return null;

            const isDeclined = myProposal.observations?.includes('DECLINED_BY_SUPPLIER');

            const myTotal = myProposal.items.reduce((acc, current) => {
                const item = demand.items.find(i => i.id === current.itemId);
                return acc + (item ? item.quantity * current.unitPrice : 0);
            }, 0);

            let status = 'Em Análise';
            let statusCode: 'won' | 'lost' | 'pending' | 'declined' = 'pending';
            let statusColor = 'bg-yellow-100 text-yellow-800';

            if (isDeclined) {
                status = 'Declinada';
                statusCode = 'declined';
                statusColor = 'bg-gray-200 text-gray-600';
            } else if (demand.status === DemandStatus.VENCEDOR_DEFINIDO) {
                if (demand.winner?.supplierName === supplier.name) {
                    status = 'Vencedor';
                    statusCode = 'won';
                    statusColor = 'bg-green-100 text-green-800 border-green-200 border';
                } else {
                    status = 'Não Selecionado';
                    statusCode = 'lost';
                    statusColor = 'bg-red-100 text-red-800';
                }
            } else if ([DemandStatus.CONCLUIDA, DemandStatus.FECHADA, DemandStatus.CANCELADA, DemandStatus.REPROVADA].includes(demand.status)) {
                if (demand.winner?.supplierName === supplier.name) {
                    status = 'Vencedor';
                    statusCode = 'won';
                    statusColor = 'bg-green-100 text-green-800 border-green-200 border';
                } else {
                    status = 'Não Selecionado';
                    statusCode = 'lost';
                    statusColor = 'bg-red-100 text-red-800';
                }
            } else if (demand.status === DemandStatus.AGUARDANDO_PROPOSTA) {
                status = 'Aguardando Encerramento';
                statusCode = 'pending';
                statusColor = 'bg-blue-100 text-blue-800';
            }

            // Filter questions asked by this supplier for this demand
            const myQuestions = demand.questions.filter(q => q.supplier_id === supplier.id || q.supplierName === supplier.name);

            return {
                demandId: demand.id,
                protocol: demand.protocol,
                title: demand.title,
                myTotal: isDeclined ? 0 : myTotal,
                status,
                statusCode,
                statusColor,
                winnerTotal: demand.winner?.totalValue,
                winnerName: demand.winner?.supplierName,
                isDeclined,
                proposalDeadline: demand.proposalDeadline,
                deliveryDeadline: demand.deadline,
                questions: myQuestions,
                submittedAt: myProposal.submittedAt
            };
        }).filter(Boolean).sort((a, b) => b!.demandId - a!.demandId);

    }, [demands, supplier]);

    // Statistics Calculation
    const stats = useMemo(() => {
        const counts = { won: 0, lost: 0, pending: 0, declined: 0 };
        let totalWonValue = 0;

        myProposalsData.forEach(p => {
            if (!p) return;

            counts[p.statusCode]++;

            if (p.statusCode === 'won' && !p.isDeclined) {
                totalWonValue += p.myTotal;
            }
        });

        return {
            counts,
            totalWonValue,
            totalCount: myProposalsData.length
        };
    }, [myProposalsData]);

    const handleExportPDF = async () => {
        const input = document.getElementById('supplier-report-container');
        if (!input) return;

        setIsExporting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Allow render to stabilize
            const canvas = await html2canvas(input, {
                scale: 2,
                backgroundColor: '#f8fafc',
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`relatorio-fornecedor-${supplier.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Export failed", error);
            toastError("Erro ao gerar PDF. Tente novamente.");
        } finally {
            setIsExporting(false);
        }
    };

    if (!supplier) return null;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <PageHeader
                    title="Meus Relatórios Detalhados"
                    subtitle="Acompanhe o histórico completo e status de todas as suas propostas."
                    showButton={false}
                />
                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg shadow-md hover:bg-slate-900 transition-colors disabled:opacity-50 font-medium"
                >
                    <DownloadIcon className="w-5 h-5" />
                    {isExporting ? 'Gerando PDF...' : 'Baixar Relatório PDF'}
                </button>
            </div>

            <div id="supplier-report-container" className="space-y-8 p-1">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ChartBarIcon className="w-5 h-5" /></div>
                            <p className="text-sm font-medium text-slate-500">Total Propostas</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.totalCount}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircleIcon className="w-5 h-5" /></div>
                            <p className="text-sm font-medium text-slate-500">Demandas Ganhas</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.counts.won}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarIcon className="w-5 h-5" /></div>
                            <p className="text-sm font-medium text-slate-500">Valor Acumulado (Ganho)</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.totalWonValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><ClockIcon className="w-5 h-5" /></div>
                            <p className="text-sm font-medium text-slate-500">Aguardando Resultado</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stats.counts.pending}</p>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
                    <div className="p-5 border-b border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800">Histórico Detalhado</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-slate-50 border-b border-slate-200/80">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Protocolo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Objeto da Demanda</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Minha Proposta</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80">
                                {myProposalsData.map(p => {
                                    if (!p) return null;
                                    const isExpanded = expandedId === p.demandId;
                                    return (
                                        <React.Fragment key={p.protocol}>
                                            <tr
                                                onClick={() => toggleExpand(p.demandId)}
                                                className={`transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{p.protocol}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 max-w-xs truncate">{p.title}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.statusColor}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold text-right">
                                                    {p.isDeclined ? (
                                                        <span className="text-slate-400 italic font-normal">Declinada</span>
                                                    ) : (
                                                        p.myTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                                        <svg className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="bg-slate-50/80 border-b border-slate-200 shadow-inner">
                                                    <td colSpan={5} className="p-6">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 animate-fade-in-down">
                                                            {/* Section 1: Deadlines */}
                                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                                    <CalendarIcon className="w-4 h-4" /> Prazos e Datas
                                                                </h4>
                                                                <div className="space-y-3 text-sm">
                                                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                                                        <span className="text-slate-600">Data do Envio da Proposta:</span>
                                                                        <span className="font-medium text-slate-800">{new Date(p.submittedAt).toLocaleDateString('pt-BR')} às {new Date(p.submittedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                                                        <span className="text-slate-600">Encerramento da Cotação:</span>
                                                                        <span className="font-medium text-slate-800">{p.proposalDeadline ? new Date(p.proposalDeadline).toLocaleDateString('pt-BR') : 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-600">Prazo Final de Entrega/Execução:</span>
                                                                        <span className="font-medium text-blue-700">{p.deliveryDeadline ? new Date(p.deliveryDeadline).toLocaleDateString('pt-BR') : 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Section 2: Financials */}
                                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                                    <DollarIcon className="w-4 h-4" /> Comparativo de Valores
                                                                </h4>
                                                                <div className="space-y-3 text-sm">
                                                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                                        <span className="text-slate-600">Minha Proposta:</span>
                                                                        <span className={`font-bold text-lg ${p.status === 'Vencedor' ? 'text-green-600' : 'text-slate-700'}`}>
                                                                            {p.isDeclined ? 'R$ 0,00' : p.myTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                        </span>
                                                                    </div>
                                                                    {p.winnerTotal ? (
                                                                        <div className="flex justify-between items-center bg-green-50 p-2 rounded -mx-2">
                                                                            <div>
                                                                                <span className="text-green-800 block font-medium">Vencedor:</span>
                                                                                <span className="text-xs text-green-600">{p.winnerName}</span>
                                                                            </div>
                                                                            <span className="font-bold text-lg text-green-700">
                                                                                {p.winnerTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center py-2 text-slate-400 italic text-xs">
                                                                            Vencedor ainda não definido
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Section 3: Questions */}
                                                        {p.questions.length > 0 && (
                                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm animate-fade-in-down">
                                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                                    <QAIcon className="w-4 h-4" /> Histórico de Perguntas
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    {p.questions.map((q, idx) => (
                                                                        <div key={q.id} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                                                <span>Pergunta #{idx + 1}</span>
                                                                                <span>{new Date(q.askedAt).toLocaleDateString('pt-BR')}</span>
                                                                            </div>
                                                                            <p className="text-slate-700 font-medium mb-2">"{q.question}"</p>
                                                                            {q.answer ? (
                                                                                <div className="pl-3 border-l-2 border-green-400">
                                                                                    <p className="text-xs text-green-700 font-bold mb-0.5">Resposta:</p>
                                                                                    <p className="text-slate-600">{q.answer}</p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="pl-3 border-l-2 border-amber-300">
                                                                                    <p className="text-xs text-amber-600 italic">Aguardando resposta...</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                        {myProposalsData.length === 0 && <p className="text-center text-slate-500 py-10">Você ainda não enviou nenhuma proposta.</p>}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
