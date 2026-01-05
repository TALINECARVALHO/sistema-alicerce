
import React, { useState, useMemo, useEffect } from 'react';
import { Demand, Supplier, Group, DemandStatus } from '../types';
import PageHeader from './PageHeader';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { STATUS_COLORS, DEPARTMENTS } from '../constants';
import {
    SearchIcon,
    MegaphoneIcon,
    TruckIcon,
    DownloadIcon,
    CheckCircleIcon,
    FilterIcon,
    BuildingIcon,
    LocationMarkerIcon,
    ClockIcon,
    TagIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    ChatIcon,
} from './icons';
import { Pagination } from './Pagination';
import { formatDeliveryTime } from '../utils/delivery';

export const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            category: "Credenciamento",
            icon: "📝",
            questions: [
                {
                    question: "Como é realizado o credenciamento de fornecedores?",
                    answer: "O credenciamento é realizado de forma totalmente eletrônica, por meio do Sistema Alicerce, plataforma oficial da Prefeitura de São Francisco de Paula/RS para gestão das contratações públicas."
                },
                {
                    question: "A inscrição no Sistema Alicerce é obrigatória?",
                    answer: "Sim. A inscrição no Sistema Alicerce é condição indispensável para participação no credenciamento."
                },
                {
                    question: "O que é necessário para se inscrever no sistema?",
                    answer: "O fornecedor deve realizar o cadastro na plataforma, preencher os dados solicitados, selecionar os grupos de materiais e/ou serviços de interesse e anexar a documentação exigida no Edital."
                },
                {
                    question: "Posso me credenciar em qualquer grupo de materiais ou serviços?",
                    answer: "Não. O fornecedor deve selecionar apenas os grupos compatíveis com seus CNAEs, sendo vedada a indicação de grupos sem vinculação com as atividades registradas."
                },
                {
                    question: "Como ocorre a análise do credenciamento?",
                    answer: "A Administração Municipal analisará as informações e documentos diretamente no sistema, aprovando apenas os fornecedores que atenderem integralmente aos requisitos legais e técnicos."
                },
                {
                    question: "Como saberei se meu credenciamento foi aprovado?",
                    answer: "Após a aprovação, o fornecedor receberá um e-mail com os dados de acesso ao sistema e um tutorial de utilização."
                },
                {
                    question: "Onde posso consultar o edital completo do processo?",
                    answer: "O edital completo com todas as informações do processo está publicado no Portal da Transparência. Acesse: https://grp.saofranciscodepaula.rs.gov.br/transparencia/portal/#/consultaLicitacao/detalhesLicitacao/eyJudW1lcm9Ub3RhbCI6NTAzNSwidGlwb0F2YWxpYWNhbyI6IkkiLCJhZG1pbmlzdHJhY2FvIjoxLCJ0aXBvIjoiUCIsIm1vc3RyYUxpbmsiOnRydWV9"
                }
            ]
        },
        {
            category: "Propostas e Cotações",
            icon: "💼",
            questions: [
                {
                    question: "Como receberei as oportunidades de cotação?",
                    answer: "As oportunidades serão encaminhadas automaticamente pelo Sistema Alicerce, conforme os grupos em que o fornecedor estiver habilitado."
                },
                {
                    question: "Como devo enviar minha proposta?",
                    answer: "A proposta deve ser preenchida e enviada exclusivamente pelo Sistema Alicerce, dentro do prazo definido para cada demanda."
                },
                {
                    question: "Posso alterar a proposta após o envio ou após o encerramento do prazo?",
                    answer: "Não. Após o envio da proposta ou o encerramento do prazo, não será permitida qualquer alteração."
                },
                {
                    question: "É possível encaminhar dúvidas sobre a demanda?",
                    answer: "Sim. Durante o período de envio das propostas, o fornecedor poderá encaminhar dúvidas pelo próprio sistema."
                },
                {
                    question: "Como funciona a análise das propostas?",
                    answer: "A análise é realizada de forma cega e isonômica, considerando exclusivamente os dados apresentados, sem identificação dos proponentes."
                },
                {
                    question: "Como funciona a fase de cotação?",
                    answer: "A Administração encaminha o pedido de cotação simultaneamente a todos os fornecedores credenciados e habilitados nos grupos correspondentes. As propostas permanecem sigilosas."
                }
            ]
        },
        {
            category: "Prazos",
            icon: "⏰",
            questions: [
                {
                    question: "Quais são os prazos para envio de propostas (cotação)?",
                    answer: "Prioridade Urgente: 1 dia útil | Prioridade Média: 3 dias úteis | Prioridade Baixa: 5 dias úteis"
                },
                {
                    question: "Quais são os prazos para entrega ou execução?",
                    answer: "Materiais - Urgente: até 1 dia útil, Normal: até 3 dias úteis, Baixa: até 5 dias úteis | Serviços - Urgente: até 2 dias úteis, Normal: até 5 dias úteis, Baixa: até 10 dias úteis"
                },
                {
                    question: "Os prazos podem ser descumpridos?",
                    answer: "Não. Os prazos definidos devem ser rigorosamente observados no envio das propostas e na entrega ou execução."
                }
            ]
        },
        {
            category: "Documentação e Habilitação",
            icon: "📄",
            questions: [
                {
                    question: "Quais documentos são exigidos para habilitação?",
                    answer: "Documentos de habilitação jurídica, regularidade fiscal e regularidade trabalhista, conforme detalhado no Edital."
                }
            ]
        },
        {
            category: "Resultado e Contratação",
            icon: "🏆",
            questions: [
                {
                    question: "Como é feita a escolha da proposta vencedora?",
                    answer: "Após a análise cega, o sistema gera ranking automático. A Administração seleciona a proposta mais vantajosa com base em critérios objetivos. Em caso de empate, vence a proposta enviada em menor tempo."
                },
                {
                    question: "Quando ocorre a identificação do fornecedor vencedor?",
                    answer: "Somente após a homologação do resultado, quando ocorre a quebra do sigilo da identidade do vencedor."
                },
                {
                    question: "A Administração é obrigada a contratar após a cotação?",
                    answer: "Não. A Administração pode não efetivar a contratação por razões devidamente justificadas de interesse público."
                },
                {
                    question: "Como é formalizada a contratação?",
                    answer: "A contratação é formalizada por meio de Nota de Empenho, que servirá como instrumento hábil para execução do objeto."
                }
            ]
        },
        {
            category: "Pagamento",
            icon: "💰",
            questions: [
                {
                    question: "Como funciona o pagamento?",
                    answer: "Serviços: pagamento em até 5 dias úteis após emissão da nota fiscal. Materiais: notas recebidas entre dias 1-15 são pagas no dia 25 subsequente; notas recebidas entre dias 16-30/31 são pagas no dia 10 subsequente."
                }
            ]
        }
    ];

    // Flatten all questions with their category for indexing
    const allQuestions = faqs.flatMap((category, catIndex) =>
        category.questions.map((q, qIndex) => ({
            ...q,
            categoryName: category.category,
            categoryIcon: category.icon,
            globalIndex: catIndex * 100 + qIndex
        }))
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-down py-16 px-4">
            <div className="text-center mb-12">
                <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Tire suas Dúvidas</span>
                <h2 className="text-5xl font-extrabold text-slate-800 mt-2 mb-4">Perguntas Frequentes</h2>
                <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
                    Entenda como funciona o processo de credenciamento, cotação e contratação no Sistema Alicerce.
                </p>
            </div>

            <div className="space-y-6">
                {faqs.map((category, catIndex) => (
                    <div key={catIndex} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        {/* Category Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{category.icon}</span>
                                <h3 className="text-xl font-bold text-slate-800">{category.category}</h3>
                                <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                    {category.questions.length} {category.questions.length === 1 ? 'pergunta' : 'perguntas'}
                                </span>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="divide-y divide-slate-100">
                            {category.questions.map((faq, qIndex) => {
                                const globalIndex = catIndex * 100 + qIndex;
                                const isOpen = openIndex === globalIndex;

                                return (
                                    <div key={qIndex} className="transition-all">
                                        <button
                                            onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                                            className="w-full px-6 py-5 text-left hover:bg-slate-50 transition-colors flex items-start gap-4 group"
                                        >
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen
                                                ? 'bg-blue-600 text-white rotate-180'
                                                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                                                }`}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-bold text-base leading-tight transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'
                                                    }`}>
                                                    {faq.question}
                                                </h4>
                                            </div>
                                        </button>

                                        {/* Answer - Accordion */}
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                            }`}>
                                            <div className="px-6 pb-5 pl-18">
                                                <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-4">
                                                    <p className="text-slate-700 leading-relaxed">
                                                        {faq.answer.includes('https://') ? (
                                                            <>
                                                                {faq.answer.split('https://')[0]}
                                                                <a
                                                                    href={`https://${faq.answer.split('https://')[1]}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 underline font-medium break-all"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    Clique aqui para acessar o edital completo
                                                                </a>
                                                            </>
                                                        ) : (
                                                            faq.answer
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Call to Action */}
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-3">Ainda tem dúvidas?</h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Entre em contato com a Prefeitura Municipal de São Francisco de Paula/RS para esclarecimentos adicionais.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a
                        href="mailto:contato@saofransciscodepaula.rs.gov.br"
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-all hover:scale-105 shadow-lg"
                    >
                        📧 Enviar E-mail
                    </a>
                </div>
            </div>
        </div>
    );
};

interface TransparencyPageProps {
    demands: Demand[];
    suppliers: Supplier[];
    groups: Group[];
    onSelectDemand?: (demand: Demand) => void;
    isPublic?: boolean;
}

const TransparencyPage: React.FC<TransparencyPageProps> = ({ demands, suppliers, groups, onSelectDemand, isPublic = false }) => {
    const [activeTab, setActiveTab] = useState<'demands' | 'suppliers'>('demands');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const availableDepartments = useMemo(() => {
        const unique = new Set(demands.map(d => d.requestingDepartment).filter(Boolean));
        DEPARTMENTS.forEach(d => unique.add(d));
        return Array.from(unique).sort();
    }, [demands]);

    const filteredDemands = useMemo(() => {
        let results = demands;

        // Security / Public View Enforcement
        if (isPublic) {
            results = results.filter(d =>
                d.status === DemandStatus.AGUARDANDO_PROPOSTA ||
                d.status === DemandStatus.EM_ANALISE ||
                d.status === DemandStatus.VENCEDOR_DEFINIDO ||
                d.status === DemandStatus.CONCLUIDA
            );
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            results = results.filter(d =>
                (d.title && d.title.toLowerCase().includes(lower)) ||
                (d.protocol && d.protocol.toLowerCase().includes(lower)) ||
                (d.winner?.supplierName || '').toLowerCase().includes(lower)
            );
        }
        if (selectedStatus) {
            results = results.filter(d => d.status === selectedStatus);
        }
        if (selectedDepartment) {
            results = results.filter(d => d.requestingDepartment === selectedDepartment);
        }
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [demands, searchTerm, selectedStatus, selectedDepartment, isPublic]);

    const filteredSuppliers = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return suppliers.filter(s => {
            const matchesSearch = !searchTerm ||
                (s.name && s.name.toLowerCase().includes(lowerSearch)) ||
                (s.cnpj && s.cnpj.includes(searchTerm)) ||
                (s.groups && s.groups.some(g => g.toLowerCase().includes(lowerSearch)));
            const isActive = isPublic ? s.status === 'Ativo' : true;
            return matchesSearch && isActive;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [suppliers, searchTerm, isPublic]);

    // Pagination logic
    const paginatedDemands = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredDemands.slice(startIndex, endIndex);
    }, [filteredDemands, currentPage]);

    const paginatedSuppliers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredSuppliers.slice(startIndex, endIndex);
    }, [filteredSuppliers, currentPage]);

    const totalPages = useMemo(() => {
        const total = activeTab === 'demands' ? filteredDemands.length : filteredSuppliers.length;
        return Math.ceil(total / itemsPerPage);
    }, [activeTab, filteredDemands.length, filteredSuppliers.length]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus, selectedDepartment, activeTab]);

    const handleExportPDF = () => {
        setIsExporting(true);
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFillColor('#0f172a');
        doc.rect(0, 0, 297, 24, 'F');
        doc.setTextColor('#FFFFFF');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("PORTAL DA TRANSPARÊNCIA MUNICIPAL", 14, 16);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 280, 16, { align: 'right' });

        if (activeTab === 'demands') {
            const tableBody = filteredDemands.map(d => [
                d.protocol,
                d.requestingDepartment,
                d.title,
                d.winner?.supplierName || d.status,
                d.winner?.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'
            ]);
            autoTable(doc, {
                startY: 30,
                head: [['Protocolo', 'Departamento', 'Objeto', 'Situação / Vencedor', 'Valor']],
                body: tableBody,
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
                styles: { fontSize: 8 },
            });
        } else {
            const tableBody = filteredSuppliers.map(s => [
                s.name, s.cnpj, s.address, s.groups.join(', ')
            ]);
            autoTable(doc, {
                startY: 30,
                head: [['Razão Social', 'CNPJ', 'Endereço', 'Atuação']],
                body: tableBody,
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
                styles: { fontSize: 8 },
            });
        }
        doc.save('relatorio_transparencia.pdf');
        setIsExporting(false);
    };

    // Estatísticas
    const stats = useMemo(() => {
        const totalDemands = filteredDemands.length;
        const totalSuppliers = filteredSuppliers.length;
        const totalValue = filteredDemands
            .filter(d => d.winner?.totalValue)
            .reduce((sum, d) => sum + (d.winner?.totalValue || 0), 0);
        const completedDemands = filteredDemands.filter(d =>
            d.status === DemandStatus.CONCLUIDA || d.status === DemandStatus.VENCEDOR_DEFINIDO
        ).length;

        return { totalDemands, totalSuppliers, totalValue, completedDemands };
    }, [filteredDemands, filteredSuppliers]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Hero Section */}
            <div className="relative bg-slate-900 overflow-hidden shadow-2xl">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-slate-900 opacity-90"></div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                    <div className="text-center sm:text-left mb-8">
                        <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                            <span className="block xl:inline">Portal da</span>{' '}
                            <span className="block text-blue-400 xl:inline">Transparência</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto sm:mx-0 text-base text-slate-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Acompanhe o credenciamento de serviços e materiais de construção.
                            Acesso simplificado aos dados de fornecedores e itens homologados.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/20 p-2 rounded-lg">
                                    <MegaphoneIcon className="w-6 h-6 text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.totalDemands}</p>
                                    <p className="text-xs text-blue-200">Total de Demandas</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500/20 p-2 rounded-lg">
                                    <CheckCircleIcon className="w-6 h-6 text-green-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.completedDemands}</p>
                                    <p className="text-xs text-green-200">Demanda Homologada</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-500/20 p-2 rounded-lg">
                                    <TruckIcon className="w-6 h-6 text-indigo-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.totalSuppliers}</p>
                                    <p className="text-xs text-indigo-200">Fornecedores Cadastrados</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-2 rounded-lg">
                                    <TagIcon className="w-6 h-6 text-emerald-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <p className="text-xs text-emerald-200">Valor Total Homologado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-slate-100">
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50/50">
                        <button
                            onClick={() => { setActiveTab('demands'); }}
                            className={`flex-1 py-6 text-center text-sm font-bold uppercase tracking-wider transition-all border-b-2 hover:bg-slate-50 ${activeTab === 'demands' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <MegaphoneIcon className={`w-5 h-5 ${activeTab === 'demands' ? 'text-blue-600' : 'text-slate-400'}`} />
                                Demandas e Contratações
                            </div>
                        </button>
                        <button
                            onClick={() => { setActiveTab('suppliers'); }}
                            className={`flex-1 py-6 text-center text-sm font-bold uppercase tracking-wider transition-all border-b-2 hover:bg-slate-50 ${activeTab === 'suppliers' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <TruckIcon className={`w-5 h-5 ${activeTab === 'suppliers' ? 'text-blue-600' : 'text-slate-400'}`} />
                                Rede de Fornecedores
                            </div>
                        </button>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white p-6 border-b border-slate-100 sticky top-0 z-20 shadow-sm">
                        <div className="flex flex-col xl:flex-row gap-4 justify-between">
                            <div className="flex-grow flex flex-col md:flex-row gap-4">
                                <div className="relative flex-grow md:max-w-xl">
                                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={activeTab === 'demands' ? "Buscar por número, objeto ou secretaria..." : "Buscar empresa por nome, CNPJ ou categoria..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>

                                {activeTab === 'demands' && (
                                    <>
                                        <div className="relative md:w-48">
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <option value="">Status: Todos</option>
                                                {Object.values(DemandStatus).filter(s => {
                                                    if (isPublic) {
                                                        return s === DemandStatus.AGUARDANDO_PROPOSTA ||
                                                            s === DemandStatus.EM_ANALISE ||
                                                            s === DemandStatus.VENCEDOR_DEFINIDO ||
                                                            s === DemandStatus.CONCLUIDA;
                                                    }
                                                    return true;
                                                }).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <FilterIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        <div className="relative md:w-56">
                                            <select
                                                value={selectedDepartment}
                                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <option value="">Secretaria: Todas</option>
                                                {availableDepartments.map(dep => (
                                                    <option key={dep} value={dep}>{dep}</option>
                                                ))}
                                            </select>
                                            <BuildingIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {/* View Mode Toggle */}
                                {activeTab === 'demands' && (
                                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                        <button
                                            onClick={() => setViewMode('table')}
                                            title="Visualização em Tabela"
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('cards')}
                                            title="Visualização em Cards"
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 font-medium whitespace-nowrap"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    {isExporting ? 'Gerando PDF...' : 'Baixar Relatório'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Content */}
                    <div className="bg-slate-50/50">
                        {/* Top Pagination */}
                        {totalPages > 1 && (
                            <div className="border-b border-slate-100">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={activeTab === 'demands' ? filteredDemands.length : filteredSuppliers.length}
                                    itemsPerPage={itemsPerPage}
                                />
                            </div>
                        )}

                        {activeTab === 'demands' ? (
                            paginatedDemands.length > 0 ? (
                                <>
                                    {viewMode === 'table' ? (
                                        /* Table View */
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-slate-100 border-b-2 border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Protocolo</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Data</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Objeto</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Secretaria</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Dúvidas</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Vencedor</th>
                                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-100">
                                                    {paginatedDemands.map(demand => {
                                                        const statusColor = STATUS_COLORS[demand.status];
                                                        return (
                                                            <tr
                                                                key={demand.id}
                                                                onClick={() => onSelectDemand && onSelectDemand(demand)}
                                                                className="hover:bg-blue-50 cursor-pointer transition-colors"
                                                            >
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                                                        {demand.protocol}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                                    {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="max-w-md">
                                                                        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{demand.title}</p>
                                                                        {demand.items && demand.items.length > 0 && (
                                                                            <p className="text-xs text-slate-500 mt-1">{demand.items.length} {demand.items.length === 1 ? 'item' : 'itens'}</p>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                                    <div className="max-w-xs line-clamp-2">
                                                                        {demand.requestingDepartment}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
                                                                        {demand.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">
                                                                    {demand.questions?.length || 0}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-700">
                                                                    <div className="max-w-xs line-clamp-2">
                                                                        {demand.winner?.supplierName || (demand.winner?.mode === 'item' && demand.winner?.items ? (() => {
                                                                            const uniqueSuppliers = Array.from(new Set(demand.winner.items.map((i: any) => i.supplierName))).filter(Boolean);
                                                                            if (uniqueSuppliers.length === 1) return uniqueSuppliers[0];
                                                                            if (uniqueSuppliers.length > 1) return "Vários Fornecedores";
                                                                            return "-";
                                                                        })() : '-')}
                                                                        {(demand.winner?.supplierName || (demand.winner?.mode === 'item' && demand.winner?.items?.length === 1)) && (
                                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                                {suppliers.find(s => s.name === (demand.winner?.supplierName || demand.winner?.items?.[0]?.supplierName))?.cnpj || ''}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                                                                    {(demand.winner?.totalValue ?? demand.winner?.total_value)
                                                                        ? (demand.winner.totalValue ?? demand.winner?.total_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                                        : '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        /* Cards View */
                                        <div className="p-6 grid gap-4">
                                            {paginatedDemands.map(demand => {
                                                const statusColor = STATUS_COLORS[demand.status];
                                                const hasWinner = demand.status === DemandStatus.VENCEDOR_DEFINIDO || demand.status === DemandStatus.CONCLUIDA;
                                                const validProposals = demand.proposals?.filter(p => !p.observations?.includes('DECLINED')) || [];

                                                return (
                                                    <div
                                                        key={demand.id}
                                                        onClick={() => onSelectDemand && onSelectDemand(demand)}
                                                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                                                    >
                                                        {/* Decorative gradient bar */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasWinner ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-gradient-to-b from-blue-500 to-indigo-600'}`}></div>

                                                        <div className="flex flex-col gap-4 pl-4 p-6">
                                                            {/* Header Section */}
                                                            <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                        <span className="bg-slate-100 text-slate-700 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-200 font-bold">
                                                                            {demand.protocol}
                                                                        </span>
                                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                            <ClockIcon className="w-3.5 h-3.5" />
                                                                            {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                                                                        </span>
                                                                        <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                                                                            {demand.status}
                                                                        </span>
                                                                    </div>

                                                                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
                                                                        {demand.title}
                                                                    </h3>

                                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                                                        <div className="flex items-center gap-2">
                                                                            <BuildingIcon className="w-4 h-4 text-slate-400" />
                                                                            <span className="font-medium">{demand.requestingDepartment}</span>
                                                                        </div>
                                                                        {demand.items && demand.items.length > 0 && (
                                                                            <div className="flex items-center gap-2">
                                                                                <TagIcon className="w-4 h-4 text-slate-400" />
                                                                                <span className="text-xs text-slate-500">{demand.items.length} {demand.items.length === 1 ? 'item' : 'itens'}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-2">
                                                                            <ChatIcon className="w-4 h-4 text-slate-400" />
                                                                            <span className="text-xs text-slate-500">{demand.questions?.length || 0} dúvidas</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="hidden sm:flex h-12 w-12 bg-slate-100 rounded-full items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:scale-110 flex-shrink-0">
                                                                    <span className="text-2xl">→</span>
                                                                </div>
                                                            </div>

                                                            {/* Proposals Section - Only show when there's a winner */}
                                                            {hasWinner && validProposals.length > 0 && (
                                                                <div className="border-t border-slate-200 pt-4 mt-2">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <UsersIcon className="w-4 h-4 text-slate-500" />
                                                                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                                                            Propostas Recebidas ({validProposals.length})
                                                                        </h4>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                        {validProposals.map((proposal, idx) => {
                                                                            const isWinner = proposal.supplierName === demand.winner?.supplierName;

                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className={`p-3 rounded-lg border-2 transition-all ${isWinner
                                                                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md'
                                                                                        : 'bg-slate-50 border-slate-200'
                                                                                        }`}
                                                                                >
                                                                                    {isWinner && (
                                                                                        <div className="flex items-center gap-1 mb-2">
                                                                                            <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
                                                                                            <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Vencedor</span>
                                                                                        </div>
                                                                                    )}

                                                                                    <p className={`font-bold text-sm mb-1 ${isWinner ? 'text-green-900' : 'text-slate-700'}`}>
                                                                                        {proposal.supplierName}
                                                                                    </p>

                                                                                    <div className="space-y-1">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Valor:</span>
                                                                                            <span className={`text-sm font-bold ${isWinner ? 'text-green-600' : 'text-slate-700'}`}>
                                                                                                {(proposal.totalValue ?? (proposal as any).total_value)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                                            </span>
                                                                                        </div>

                                                                                        {proposal.deliveryTime && (
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-[10px] text-slate-500 uppercase font-semibold">Prazo:</span>
                                                                                                <span className={`text-xs font-medium ${isWinner ? 'text-green-700' : 'text-slate-600'}`}>
                                                                                                    {formatDeliveryTime(proposal.deliveryTime, proposal.submittedAt, demand.deadline)}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Winner Only (when no proposals to show) */}
                                                            {demand.winner && validProposals.length === 0 && (
                                                                <div className="border-t border-slate-200 pt-4 mt-2">
                                                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                                                            <p className="text-xs text-green-700 uppercase tracking-wider font-bold">Vencedor</p>
                                                                        </div>
                                                                        <p className="font-bold text-slate-900 text-base mb-1">{demand.winner.supplierName}</p>
                                                                        <p className="text-[10px] text-slate-400 font-mono mb-2">
                                                                            CNPJ: {suppliers.find(s => s.name === demand.winner?.supplierName)?.cnpj || '-'}
                                                                        </p>
                                                                        <div className="mb-3 flex items-center gap-2">
                                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${demand.winner?.mode === 'item' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                                                {demand.winner?.mode === 'item' ? '🚀 Misto (por Item)' : '🏢 Homologação Global'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-green-600 font-bold text-lg">
                                                                            {(demand.winner.totalValue ?? demand.winner.total_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* No Winner Yet */}
                                                            {!demand.winner && (
                                                                <div className="border-t border-slate-200 pt-4 mt-2">
                                                                    <div className="text-center flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                                                                        <InformationCircleIcon className="w-5 h-5" />
                                                                        <span className="text-xs font-medium">Aguardando definição</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        totalItems={filteredDemands.length}
                                        itemsPerPage={itemsPerPage}
                                    />
                                </>
                            ) : (
                                <div className="text-center py-24">
                                    <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
                                        <MegaphoneIcon className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">Nenhum registro encontrado</h3>
                                    <p className="text-slate-500 mt-1">Tente ajustar seus filtros de busca.</p>
                                </div>
                            )
                        ) : (
                            paginatedSuppliers.length > 0 ? (
                                <>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {paginatedSuppliers.map(supplier => (
                                            <div key={supplier.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-100">
                                                            {supplier.name.charAt(0)}
                                                        </div>
                                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                                                            <CheckCircleIcon className="w-3 h-3" /> Regular
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2" title={supplier.name}>{supplier.name}</h3>
                                                    <p className="text-slate-400 text-xs font-mono mb-4">CNPJ: {supplier.cnpj}</p>

                                                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                                                        <div className="flex items-start gap-2">
                                                            <LocationMarkerIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                            <span className="line-clamp-2 text-xs">{supplier.address}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-100 mt-2">
                                                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Áreas de Atuação</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {supplier.groups.slice(0, 3).map(g => (
                                                            <span key={g} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100 font-medium">
                                                                {g}
                                                            </span>
                                                        ))}
                                                        {supplier.groups.length > 3 && (
                                                            <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-200">
                                                                +{supplier.groups.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        totalItems={filteredSuppliers.length}
                                        itemsPerPage={itemsPerPage}
                                    />
                                </>
                            ) : (
                                <div className="text-center py-24">
                                    <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
                                        <TruckIcon className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">Nenhum fornecedor encontrado</h3>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Footer simple for portal */}
                <div className="text-center mt-12 text-slate-500 text-sm">
                    <p>&copy; 2025 Prefeitura Municipal - Sistema Alicerce. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default TransparencyPage;
