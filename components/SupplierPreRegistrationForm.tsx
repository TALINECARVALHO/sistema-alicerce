
import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo, useEffect } from 'react';
import { Supplier, Group } from '../types';
import { BuildingIcon, MailIcon, PhoneIcon, ChartBarIcon, BellIcon, ShieldCheckIcon, UsersIcon, LocationMarkerIcon, DollarIcon, LoginIcon, ClipboardListIcon, BackIcon, CheckCircleIcon, CalendarIcon } from './icons';

interface SupplierPreRegistrationFormProps {
    groups: Group[];
    onSubmit: (supplier: Omit<Supplier, 'id' | 'status'>, files?: Record<string, File | null>) => Promise<void>;
    onCancel?: () => void;
    onLogin?: () => void; // New prop for login navigation
    isPublicView: boolean;
    initialData?: Supplier; // Added for editing
}

const documentList = [
    'Contrato/Estatuto Social',
    'Cartão CNPJ',
    'CND Municipal',
    'CND Estadual',
    'CND Tributos Federais',
    'CNDT (Trabalhistas)',
    'CRF (FGTS)',
    'Certidão de Falência'
];

const mandatoryTerms = [
    "a) Está ciente e concorda com as condições contidas no edital e seus anexos, bem como de que o valor da contraprestação compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de sua entrega em definitivo e que cumpre plenamente os requisitos de habilitação definidos no instrumento convocatório.",
    "b) Não possui servidor público ou de empresa pública, da ativa, em seu quadro societário do Município de São Francisco de Paula, Estado do Rio Grande do Sul e União.",
    "c) Conhece e cumpre, bem como continuará a cumprir, o previsto na Lei Federal nº 12.846/2013, de 01.08.2013 (Lei Anticorrupção), bem como o previsto no Decreto Federal nº 8.420/2015 e Decreto Municipal 1851/2019, abstendo-se de cometer atos tendentes a lesar a Administração Pública.",
    "d) Cumpre os requisitos para a habilitação e a conformidade de sua proposta com as exigências do edital, respondendo o declarante pela veracidade das suas informações, na forma da lei.",
    "e) Não possui em sua cadeia produtiva, empregados executando trabalho degradante ou forçado, nos termos do inciso III e IV do art.1º e no inciso III do art.5º da Constituição Federal.",
    "f) Até a presente data inexistem fatos impeditivos para sua habilitação no presente Credenciamento, ciente da obrigatoriedade de declarar ocorrências posteriores.",
    "g) Não emprega menor de 18 anos em trabalho noturno, perigoso ou insalubre e não emprega menor de 16 anos, salvo na condição de aprendiz a partir de 14 anos, nos termos do art. 7º, XXXIII, da Constituição Federal e art. 68, VI, da Lei Federal 14.133/2021.",
    "h) Recebeu todos os documentos e informações, sendo orientado acerca de todas as regras, direitos e obrigações previstas no Edital de Credenciamento Nº 05/2024, acatando-as em sua totalidade.",
    "i) Tem conhecimento dos serviços para os quais solicita credenciamento e que os realizará de forma satisfatória.",
    "j) Tem conhecimento das formas de seleção e convocação para a prestação dos serviços, bem como das formas e condições de pagamento.",
    "k) Cumpre as exigências de reserva de cargos para pessoa com deficiência e para reabilitado da Previdência Social, previstas em lei e em outras normas específicas.",
    "l) Concorda e aceita em prestar os serviços para os quais se credencia pelos preços estipulados no Edital."
];

// Helper functions for masking
const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
};

const FileInput: React.FC<{
    label: string;
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    validityDate: string;
    onDateChange: (date: string) => void;
    showDate?: boolean;
}> = ({ label, selectedFile, onFileChange, validityDate, onDateChange, showDate = true }) => (
    <div className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-3 flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-700">{label} <span className="text-red-500">*</span></label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
                <div className="flex items-center">
                    <label className="cursor-pointer px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm w-full sm:w-auto text-center">
                        Escolher arquivo
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => onFileChange(e.target.files ? e.target.files[0] : null)} />
                    </label>
                    <span className={`ml-3 text-xs truncate flex-1 ${selectedFile ? 'text-slate-700 font-medium' : 'text-red-400'}`}>{selectedFile ? selectedFile.name : 'Arquivo obrigatório'}</span>
                </div>
            </div>

            {showDate && (
                <div className="sm:w-40 flex-shrink-0">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <CalendarIcon className="h-3 w-3 text-slate-400" />
                        </div>
                        <input
                            type="date"
                            value={validityDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-2 pl-7"
                            title="Data de Validade do Documento"
                            required
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right">Validade <span className="text-red-500">*</span></p>
                </div>
            )}
        </div>
    </div>
);


const SupplierPreRegistrationForm: React.FC<SupplierPreRegistrationFormProps> = ({ groups, onSubmit, onCancel, onLogin, isPublicView, initialData }) => {
    // State to toggle between Selection Screen and Registration Form
    // Only applies if it is public view. Internal views start at 'form'.
    const { warning } = useToast();
    const [viewState, setViewState] = useState<'selection' | 'form'>(isPublicView ? 'selection' : 'form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        contactPerson: '',
        address: '',
        pixKey: '',
        bankName: '',
        agency: '',
        accountNumber: '',
    });
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [documentDates, setDocumentDates] = useState<Record<string, string>>({});
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Populate form if initialData is provided (Editing mode)
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                cnpj: initialData.cnpj,
                email: initialData.email,
                phone: initialData.phone,
                contactPerson: initialData.contactPerson,
                address: initialData.address,
                pixKey: initialData.pixKey || '',
                bankName: initialData.bankName || '',
                agency: initialData.agency || '',
                accountNumber: initialData.accountNumber || '',
            });
            setSelectedGroups(initialData.groups || []);

            // Populate existing dates if available
            if (initialData.documents) {
                const dates: Record<string, string> = {};
                initialData.documents.forEach(doc => {
                    if (doc.validityDate) {
                        dates[doc.name] = doc.validityDate;
                    }
                });
                setDocumentDates(dates);
            }

            // Assuming terms were accepted if user exists, or allowing re-acceptance on edit
            setTermsAccepted(true);
            setViewState('form');
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'cnpj') {
            finalValue = maskCNPJ(value);
        } else if (name === 'phone') {
            finalValue = maskPhone(value);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleGroupChange = (groupName: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupName)
                ? prev.filter(g => g !== groupName)
                : [...prev, groupName]
        );
    };

    const handleFileChange = (docName: string, file: File | null) => {
        setFiles(prev => ({ ...prev, [docName]: file }));
    };

    const handleDateChange = (docName: string, date: string) => {
        setDocumentDates(prev => ({ ...prev, [docName]: date }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- VALIDATION START ---
        if (!formData.name.trim()) { warning("A Razão Social é obrigatória."); return; }

        const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
        if (cleanCNPJ.length !== 14) { warning("CNPJ inválido. Certifique-se de digitar todos os 14 números."); return; }

        if (!formData.contactPerson.trim()) { warning("O Nome do Responsável é obrigatório."); return; }

        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) { warning("Telefone inválido. Digite o DDD e o número completo."); return; }

        if (!formData.email.trim()) { warning("O E-mail é obrigatório."); return; }
        if (!formData.address.trim()) { warning("O Endereço é obrigatório."); return; }

        // Banking Validation
        if (!formData.bankName.trim()) { warning("O Nome do Banco é obrigatório."); return; }
        if (!formData.agency.trim()) { warning("A Agência Bancária é obrigatória."); return; }
        if (!formData.accountNumber.trim()) { warning("A Conta Corrente é obrigatória."); return; }
        if (!formData.pixKey.trim()) { warning("A Chave PIX é obrigatória."); return; }

        // Groups Validation
        if (selectedGroups.length === 0) {
            warning("Selecione pelo menos um Grupo de Interesse para receber notificações.");
            return;
        }

        // Documents Validation
        const docErrors: string[] = [];
        documentList.forEach(docName => {
            // Check File Existence (Only for new registrations)
            if (!initialData && !files[docName]) {
                docErrors.push(`Anexo faltando: ${docName}`);
            }

            // Check Date Validity (Skip 'Contrato/Estatuto Social' AND 'Cartão CNPJ')
            if (docName !== 'Contrato/Estatuto Social' && docName !== 'Cartão CNPJ') {
                if (!documentDates[docName]) {
                    docErrors.push(`Data de validade faltando: ${docName}`);
                }
            }
        });

        if (docErrors.length > 0) {
            warning(`Atenção: Existem pendências na documentação:\n\n- ${docErrors.join('\n- ')}`);
            return;
        }

        if (!termsAccepted) {
            warning("É obrigatório concordar com as Declarações e Termos de Ciência para prosseguir.");
            return;
        }
        // --- VALIDATION END ---

        setIsSubmitting(true);

        try {
            // Prepare metadata array merged with new file info AND dates
            let documents = [];

            if (initialData && initialData.documents) {
                // If editing, start with existing docs but update dates if changed
                documents = initialData.documents.map(doc => ({
                    ...doc,
                    validityDate: documentDates[doc.name] || doc.validityDate // Prefer new date input
                }));

                // Add any new docs not in initial data (edge case)
                documentList.forEach(name => {
                    if (!documents.some(d => d.name === name)) {
                        documents.push({
                            name,
                            fileName: files[name]?.name || null,
                            validityDate: documentDates[name] || undefined
                        });
                    }
                });
            } else {
                // New registration
                documents = documentList.map(name => ({
                    name,
                    fileName: files[name]?.name || null,
                    validityDate: documentDates[name] || undefined
                }));
            }

            // Pass formData, selectedGroups AND the raw files to parent
            await onSubmit({ ...formData, groups: selectedGroups, documents }, files);

            // If successful, show success screen
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            // Error is likely handled/alerted by parent or we can do it here
        } finally {
            setIsSubmitting(false);
        }
    };

    // Improved Group Categorization Logic
    const { materialGroups, serviceGroups } = useMemo(() => {
        if (!groups) return { materialGroups: [], serviceGroups: [] };

        // Fix: Be robust against null/undefined isActive. Treat undefined as active.
        const activeGroups = groups.filter(g => g.isActive !== false);
        const mats: Group[] = [];
        const servs: Group[] = [];

        activeGroups.forEach(g => {
            // Create a searchable text string from name and description
            const text = (g.name + ' ' + (g.description || '')).toLowerCase();

            // Broad keyword matching for Materials
            const isMaterial =
                text.includes('materi') ||
                text.includes('produ') ||
                text.includes('peça') ||
                text.includes('equip') ||
                text.includes('ferrag') ||
                text.includes('cons') || // Consumo, Construção
                text.startsWith('mat');

            if (isMaterial) {
                mats.push(g);
            } else {
                // If it doesn't look like a material, put it in services/others
                servs.push(g);
            }
        });

        // Sort alphabetically
        mats.sort((a, b) => a.name.localeCompare(b.name));
        servs.sort((a, b) => a.name.localeCompare(b.name));

        return { materialGroups: mats, serviceGroups: servs };
    }, [groups]);

    const MarketingPanel = () => (
        <div className="hidden lg:block space-y-10 pr-8">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">Amplie seus negócios fornecendo para a Administração Pública</h2>
                <p className="text-lg text-slate-600">
                    O Sistema Alicerce conecta sua empresa diretamente às demandas de compras do município.
                    Participe de cotações, envie propostas e acompanhe resultados de forma 100% digital.
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex items-start">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600 mt-1">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-slate-800">Mais Oportunidades</h3>
                        <p className="text-slate-600 text-sm mt-1">Acesse dezenas de solicitações de compra e serviços semanalmente. Diversifique sua carteira de clientes.</p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="bg-green-100 p-3 rounded-lg text-green-600 mt-1">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-slate-800">Transparência e Segurança</h3>
                        <p className="text-slate-600 text-sm mt-1">Processos claros, auditáveis e seguros. Saiba exatamente quem ganhou e por qual valor.</p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="bg-amber-100 p-3 rounded-lg text-amber-600 mt-1">
                        <BellIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-slate-800">Alertas Automáticos</h3>
                        <p className="text-slate-600 text-sm mt-1">Receba e-mails sempre que uma nova demanda da sua área for aberta. Não perca nenhum negócio.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- SUCCESS SCREEN RENDER ---
    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center animate-fade-in-down border border-green-100">
                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-16 h-16 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Solicitação Recebida!</h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                        Seu pré-cadastro foi enviado com sucesso para o Departamento de Contratações. <br />
                        Nossa equipe analisará seus dados e documentos em breve.
                    </p>
                    <div className="bg-blue-50 p-6 rounded-xl text-left mb-8 border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <MailIcon className="w-5 h-5" /> Fique atento ao seu e-mail
                        </h4>
                        <p className="text-blue-800 text-sm">
                            Você receberá uma notificação no endereço <strong>{formData.email}</strong> assim que seu cadastro for aprovado, contendo suas credenciais de acesso para participar das cotações.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    // --- SELECTION SCREEN RENDER ---
    if (viewState === 'selection' && isPublicView) {
        return (
            <div className="max-w-7xl mx-auto py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <MarketingPanel />

                    <div className="space-y-6 animate-fade-in-down">
                        <div className="text-center mb-8 lg:text-left">
                            <h2 className="text-2xl font-bold text-slate-900">Área do Fornecedor</h2>
                            <p className="text-slate-600 mt-2">Escolha uma opção para continuar.</p>
                        </div>

                        <button
                            onClick={onLogin}
                            className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-md hover:shadow-xl hover:border-blue-400 transition-all group text-left flex items-center gap-6"
                        >
                            <div className="bg-blue-50 p-4 rounded-full group-hover:bg-blue-600 transition-colors">
                                <LoginIcon className="w-8 h-8 text-blue-600 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700">Já sou Cadastrado</h3>
                                <p className="text-slate-500 mt-1 text-sm group-hover:text-slate-600">Acesse sua conta para ver cotações e enviar propostas.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setViewState('form')}
                            className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-md hover:shadow-xl hover:border-green-400 transition-all group text-left flex items-center gap-6"
                        >
                            <div className="bg-green-50 p-4 rounded-full group-hover:bg-green-600 transition-colors">
                                <ClipboardListIcon className="w-8 h-8 text-green-600 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-green-700">Quero me Cadastrar</h3>
                                <p className="text-slate-500 mt-1 text-sm group-hover:text-slate-600">Faça seu pré-cadastro para começar a fornecer para a prefeitura.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- FORM RENDER ---
    return (
        <div className={`w-full mx-auto ${isPublicView ? 'max-w-7xl' : 'max-w-4xl'}`}>
            {!isPublicView && (
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-slate-900">{initialData ? `Editar: ${initialData.name}` : 'Novo Fornecedor'}</h1>
                    <p className="mt-1.5 text-slate-600">{initialData ? 'Atualize os dados e grupos de interesse do fornecedor.' : 'Cadastro manual de fornecedor pelo administrador.'}</p>
                </div>
            )}

            <div className={`grid grid-cols-1 ${isPublicView ? 'lg:grid-cols-5 gap-12 items-start' : 'gap-6'}`}>
                {isPublicView && (
                    <div className="lg:col-span-2">
                        <MarketingPanel />
                    </div>
                )}

                <form onSubmit={handleSubmit} className={`bg-white p-8 rounded-xl shadow-xl border border-slate-200/80 space-y-8 relative overflow-hidden ${isPublicView ? 'lg:col-span-3' : ''}`}>
                    {isPublicView && <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>}

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{isPublicView ? 'Formulário de Pré-inscrição' : 'Dados do Fornecedor'}</h2>
                            {isPublicView && <p className="text-slate-500 text-sm mt-1">Preencha todos os campos abaixo para iniciar seu credenciamento.</p>}
                        </div>
                        {isPublicView && (
                            <button
                                type="button"
                                onClick={() => setViewState('selection')}
                                className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <BackIcon className="w-4 h-4" /> Voltar
                            </button>
                        )}
                    </div>

                    <fieldset className="grid grid-cols-1 gap-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Razão Social <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <BuildingIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pl-10" placeholder="Ex.: Empresa Exemplo Ltda." required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700 mb-1">CNPJ <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-slate-400 text-sm font-semibold">#</span>
                                </div>
                                <input
                                    type="text"
                                    name="cnpj"
                                    id="cnpj"
                                    value={formData.cnpj}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pl-10"
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 mb-1">Nome do Responsável <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <UsersIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pl-10" placeholder="Nome completo" required />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <PhoneIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pl-10"
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">E-mail Comercial <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pl-10" placeholder="contato@empresa.com.br" required />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Usado para login e notificações de novas compras.</p>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LocationMarkerIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pl-10" placeholder="Rua, Número, Bairro, Cidade - UF, CEP" required />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200/80 pb-3 flex items-center gap-2">
                            <DollarIcon className="w-5 h-5 text-slate-500" />
                            Dados Bancários (Obrigatório)
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="bankName" className="block text-sm font-medium text-slate-700 mb-1">Nome do Banco <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="bankName"
                                    id="bankName"
                                    value={formData.bankName}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                                    placeholder="Ex: Banco do Brasil"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="agency" className="block text-sm font-medium text-slate-700 mb-1">Agência <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="agency"
                                    id="agency"
                                    value={formData.agency}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                                    placeholder="0000-0"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="accountNumber" className="block text-sm font-medium text-slate-700 mb-1">Conta Corrente <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    id="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                                    placeholder="00000-0"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="pixKey" className="block text-sm font-medium text-slate-700 mb-1">Chave PIX <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="pixKey"
                                    id="pixKey"
                                    value={formData.pixKey}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                                    placeholder="CPF/CNPJ, Email, Telefone ou Aleatória"
                                    required
                                />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200/80 pb-3">Grupos de Interesse <span className="text-red-500 text-sm">*</span></legend>
                        <p className="text-sm text-slate-500 mb-4">Selecione as categorias que sua empresa pode fornecer. Você receberá notificações apenas para estas áreas.</p>

                        {(materialGroups.length === 0 && serviceGroups.length === 0) ? (
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm text-center">
                                Nenhum grupo de fornecimento disponível no momento. Contate o administrador.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {materialGroups.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <div className="h-px bg-slate-200 flex-grow"></div>
                                            Materiais e Produtos
                                            <div className="h-px bg-slate-200 flex-grow"></div>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {materialGroups.map(group => (
                                                <label key={group.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedGroups.includes(group.name) ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGroups.includes(group.name)}
                                                        onChange={() => handleGroupChange(group.name)}
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-3 text-sm font-medium text-slate-800">{group.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {serviceGroups.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <div className="h-px bg-slate-200 flex-grow"></div>
                                            Serviços e Outros
                                            <div className="h-px bg-slate-200 flex-grow"></div>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {serviceGroups.map(group => (
                                                <label key={group.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedGroups.includes(group.name) ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGroups.includes(group.name)}
                                                        onChange={() => handleGroupChange(group.name)}
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-3 text-sm font-medium text-slate-800">{group.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </fieldset>

                    {!initialData && (
                        <fieldset>
                            <legend className="text-md font-semibold text-slate-800 mb-4 border-b border-slate-200/80 pb-2">Documentação para Análise (Obrigatório)</legend>
                            <div className="grid grid-cols-1 gap-4">
                                {documentList.map(docName => (
                                    <FileInput
                                        key={docName}
                                        label={docName}
                                        selectedFile={files[docName] || null}
                                        onFileChange={(file) => handleFileChange(docName, file)}
                                        validityDate={documentDates[docName] || ''}
                                        onDateChange={(date) => handleDateChange(docName, date)}
                                        showDate={docName !== 'Contrato/Estatuto Social' && docName !== 'Cartão CNPJ'}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Formatos aceitos: PDF, JPG, PNG. Máximo 5MB por arquivo. Informe a data de validade para certidões.</p>
                        </fieldset>
                    )}

                    <fieldset className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <legend className="text-md font-bold text-slate-800 mb-4 border-b border-slate-200/80 pb-2 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                            Declarações Obrigatórias
                        </legend>
                        <p className="text-sm text-slate-500 mb-3">
                            Para efetuar o credenciamento, é necessário declarar ciência e concordância com os seguintes termos:
                        </p>
                        <div className="bg-white border border-slate-300 rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 mb-4 shadow-inner">
                            <ul className="space-y-4 text-sm text-slate-700 text-justify leading-relaxed">
                                {mandatoryTerms.map((term, index) => (
                                    <li key={index} className="flex gap-2">
                                        <span className="flex-shrink-0 pt-0.5">•</span>
                                        <span>{term}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
                            <input
                                type="checkbox"
                                required
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                            />
                            <span className="text-sm font-semibold text-slate-800">
                                Declaro que li, compreendo e concordo integralmente com todas as declarações e termos listados acima para fins de habilitação no credenciamento.
                            </span>
                        </label>
                    </fieldset>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200/80">
                        {onCancel && (
                            <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-6 py-3 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                                Voltar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-grow md:flex-grow-0 px-8 py-3 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 transform transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Enviando...
                                </>
                            ) : (
                                isPublicView ? 'Concordar e Enviar Cadastro' : 'Salvar Fornecedor'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SupplierPreRegistrationForm;
