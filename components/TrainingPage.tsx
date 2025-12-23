
import React from 'react';
import PageHeader from './PageHeader';
import { UserRole } from '../types';
import {
    CheckCircleIcon,
    ClipboardListIcon,
    TruckIcon,
    ClockIcon,
    SparklesIcon,
    BuildingIcon,
    TagIcon,
    DollarIcon,
    LockClosedIcon,
    BellIcon
} from './icons';

const ModuleCard: React.FC<{
    number: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    important?: boolean;
}> = ({ number, title, icon, children, important = false }) => (
    <div className={`bg-white rounded-2xl shadow-sm border p-6 relative overflow-hidden transition-all hover:shadow-md ${important ? 'border-l-4 border-l-blue-600 border-slate-200' : 'border-slate-200'}`}>
        {important && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Essencial
            </div>
        )}
        <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-xl text-blue-600">
                {icon}
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Módulo {number}</span>
                <h3 className="text-xl font-extrabold text-slate-800 leading-tight">{title}</h3>
            </div>
        </div>
        <div className="text-slate-600 text-sm leading-relaxed space-y-4">
            {children}
        </div>
    </div>
);

interface TrainingPageProps {
    userRole?: UserRole;
}

const TrainingPage: React.FC<TrainingPageProps> = ({ userRole }) => {
    const isSupplier = userRole === UserRole.FORNECEDOR;

    if (isSupplier) {
        // MANUAL PARA FORNECEDORES
        return (
            <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in-down">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <TruckIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-green-100">Guia do Fornecedor</span>
                        </div>
                        <h1 className="text-4xl font-black mb-4">Manual do Fornecedor Credenciado</h1>
                        <p className="text-green-100 text-lg max-w-3xl leading-relaxed">
                            Aprenda a participar das cotações, enviar propostas competitivas e aproveitar as oportunidades de negócio com a Prefeitura.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ModuleCard
                        number="01"
                        title="Como Funciona o Sistema"
                        icon={<ClipboardListIcon className="w-6 h-6" />}
                        important={true}
                    >
                        <p>O Sistema Alicerce conecta fornecedores credenciados com as necessidades da Prefeitura de forma transparente e ágil.</p>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="font-bold text-blue-800 mb-2">📋 Fluxo de Cotação:</p>
                            <ol className="space-y-2 text-blue-700 text-sm">
                                <li><strong>1.</strong> Secretaria cria demanda</li>
                                <li><strong>2.</strong> Você recebe notificação por email</li>
                                <li><strong>3.</strong> Envia sua proposta (preço + prazo)</li>
                                <li><strong>4.</strong> Sistema ranqueia automaticamente</li>
                                <li><strong>5.</strong> Melhor proposta vence</li>
                            </ol>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 mt-3">
                            <p className="font-bold text-green-800 mb-2">🏆 Critérios de Seleção:</p>
                            <ol className="space-y-1 text-green-700 text-sm">
                                <li><strong>1º:</strong> Menor preço</li>
                                <li><strong>2º:</strong> Menor prazo de entrega (em caso de empate)</li>
                            </ol>
                        </div>
                    </ModuleCard>

                    <ModuleCard
                        number="02"
                        title="Recebendo Notificações"
                        icon={<BellIcon className="w-6 h-6" />}
                    >
                        <p>Você será notificado por <strong>email</strong> sempre que houver uma nova oportunidade no seu grupo de fornecimento.</p>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                            <p className="font-bold text-amber-800 mb-2">⚠️ Importante:</p>
                            <ul className="space-y-1 text-amber-700 text-sm">
                                <li>• Verifique seu email regularmente</li>
                                <li>• Adicione nosso email aos contatos</li>
                                <li>• Responda dentro do prazo da demanda</li>
                            </ul>
                        </div>
                    </ModuleCard>

                    <ModuleCard
                        number="03"
                        title="Enviando Propostas"
                        icon={<DollarIcon className="w-6 h-6" />}
                    >
                        <p>Ao acessar uma demanda, você pode enviar sua proposta de preço para cada item solicitado.</p>
                        <div className="space-y-2">
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <p className="font-bold text-green-800 text-xs mb-1">✅ Dicas para Vencer:</p>
                                <ul className="text-[10px] text-green-700 space-y-1">
                                    <li>• Seja competitivo no preço</li>
                                    <li>• Responda rapidamente</li>
                                    <li>• Ofereça prazo de entrega curto</li>
                                </ul>
                            </div>
                        </div>
                    </ModuleCard>

                    <ModuleCard
                        number="04"
                        title="Prazos de Cotação"
                        icon={<ClockIcon className="w-6 h-6" />}
                    >
                        <p>Cada demanda tem um prazo específico para envio de propostas. Fique atento!</p>
                        <div className="space-y-3">
                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                <p className="font-bold text-red-800 text-xs uppercase">Urgente</p>
                                <p className="text-[10px] text-red-700">Prazo: <strong>1 dia útil</strong></p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="font-bold text-blue-800 text-xs uppercase">Média</p>
                                <p className="text-[10px] text-blue-700">Prazo: <strong>3 dias úteis</strong></p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-bold text-slate-800 text-xs uppercase">Baixa</p>
                                <p className="text-[10px] text-slate-600">Prazo: <strong>5 dias úteis</strong></p>
                            </div>
                        </div>
                    </ModuleCard>

                    <ModuleCard
                        number="05"
                        title="Acompanhando Resultados"
                        icon={<CheckCircleIcon className="w-6 h-6" />}
                    >
                        <p>Após o prazo de cotação, o sistema define automaticamente o vencedor pelo menor preço.</p>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="font-bold text-blue-800 mb-2">📊 Você pode ver:</p>
                            <ul className="space-y-1 text-blue-700 text-sm">
                                <li>• Suas propostas enviadas</li>
                                <li>• Status de cada cotação</li>
                                <li>• Demandas que você venceu</li>
                                <li>• Histórico de participações</li>
                            </ul>
                        </div>
                    </ModuleCard>

                    <ModuleCard
                        number="06"
                        title="Após Vencer a Cotação"
                        icon={<TruckIcon className="w-6 h-6" />}
                    >
                        <p>Se você vencer, a Secretaria entrará em contato para formalizar o pedido e alinhar a entrega.</p>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <p className="font-bold text-green-800 mb-2">✅ Próximos Passos:</p>
                            <ol className="list-decimal pl-5 space-y-2 text-green-700 text-sm">
                                <li>Aguarde contato da Secretaria</li>
                                <li>Confirme disponibilidade do material</li>
                                <li>Alinhe prazo e local de entrega</li>
                                <li>Emita nota fiscal conforme solicitado</li>
                            </ol>
                        </div>
                    </ModuleCard>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <h3 className="text-2xl font-bold mb-2">Dúvidas ou Problemas Técnicos?</h3>
                        <p className="text-green-100">Entre em contato com o Departamento de Contratações para suporte ou esclarecimentos sobre o sistema.</p>
                    </div>
                    <button className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors shadow-lg">
                        Falar com Suporte
                    </button>
                </div>

                <style>{`
                    @keyframes fade-in-down {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-down {
                        animation: fade-in-down 0.5s ease-out forwards;
                    }
                `}</style>
            </div>
        );
    }

    // MANUAL PARA SECRETARIAS (CONTEÚDO ORIGINAL)
    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in-down">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-blue-400">Capacitação Obrigatória</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4">Guia do Servidor Requisitante</h1>
                    <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">
                        Aprenda a planejar suas compras e serviços com agilidade, transparência e foco total em materiais de construção e pequenos reparos.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ModuleCard
                    number="01"
                    title="O Que Podemos Comprar?"
                    icon={<BuildingIcon className="w-6 h-6" />}
                    important={true}
                >
                    <p>O Sistema Alicerce foi desenvolvido com foco específico para otimizar a manutenção urbana e rural.</p>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="font-bold text-green-800 mb-2">✅ Permitido:</p>
                        <ul className="space-y-1 text-green-700">
                            <li>• Areia, Cimento, Tijolos e Britas</li>
                            <li>• Tintas, Madeiras e Ferragens</li>
                            <li>• Material Hidráulico e Elétrico</li>
                            <li>• Serviços de Reparo e Manutenção</li>
                        </ul>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="font-bold text-red-800 mb-2">❌ Não permitido:</p>
                        <ul className="space-y-1 text-red-700">
                            <li>• Papelaria e Escritório</li>
                            <li>• Merenda Escolar</li>
                            <li>• Medicamentos</li>
                        </ul>
                    </div>
                </ModuleCard>

                <ModuleCard
                    number="02"
                    title="Entendendo o Fluxo"
                    icon={<ClipboardListIcon className="w-6 h-6" />}
                >
                    <p>O processo é 100% digital e segue etapas rigorosas para sua segurança:</p>
                    <div className="relative border-l-2 border-blue-100 ml-4 pl-6 space-y-6">
                        <div className="relative">
                            <div className="absolute -left-8 top-1 w-4 h-4 bg-blue-600 rounded-full border-4 border-blue-100"></div>
                            <p className="font-bold text-slate-800">1. Cadastro da Demanda</p>
                            <p className="text-xs">Você preenche o que precisa e anexa fotos se necessário.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-8 top-1 w-4 h-4 bg-slate-300 rounded-full border-4 border-slate-100"></div>
                            <p className="font-bold text-slate-800">2. Cotação de Mercado</p>
                            <p className="text-xs">O sistema notifica empresas credenciadas automaticamente.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-8 top-1 w-4 h-4 bg-slate-300 rounded-full border-4 border-slate-100"></div>
                            <p className="font-bold text-slate-800">3. Vencedor Definido</p>
                            <p className="text-xs">Você recebe o nome do fornecedor e valor final.</p>
                        </div>
                    </div>
                </ModuleCard>

                <ModuleCard
                    number="03"
                    title="Prazos e Prioridades"
                    icon={<ClockIcon className="w-6 h-6" />}
                >
                    <p>O sistema trabalha com <strong>Dias Úteis Reais</strong>. Não conte sábados, domingos ou feriados.</p>
                    <div className="space-y-3">
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <p className="font-bold text-red-800 text-xs uppercase">Urgente</p>
                            </div>
                            <p className="text-[10px] text-red-700">Cotação: <strong>1 dia útil</strong>.</p>
                            <p className="text-[10px] text-red-700">Entrega/Serviço: <strong>1 a 2 dias úteis</strong>.</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <p className="font-bold text-blue-800 text-xs uppercase">Média</p>
                            </div>
                            <p className="text-[10px] text-blue-700">Cotação: <strong>3 dias úteis</strong>.</p>
                            <p className="text-[10px] text-blue-700">Entrega/Serviço: <strong>3 a 5 dias úteis</strong>.</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <p className="font-bold text-slate-800 text-xs uppercase">Baixa</p>
                            </div>
                            <p className="text-[10px] text-slate-600">Cotação: <strong>5 dias úteis</strong>.</p>
                            <p className="text-[10px] text-slate-600">Entrega/Serviço: <strong>5 a 10 dias úteis</strong>.</p>
                        </div>
                    </div>
                </ModuleCard>

                <ModuleCard
                    number="04"
                    title="Uso do Catálogo"
                    icon={<TagIcon className="w-6 h-6" />}
                >
                    <p>Ao adicionar itens, sempre tente usar o que já está cadastrado no sistema.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Busca Inteligente:</strong> Digite apenas parte da palavra (ex: "Cimento").</li>
                        <li><strong>Item inexistente?</strong> Caso não encontre o que precisa, você deve <strong>solicitar a inclusão ao Departamento de Compras</strong> antes de abrir a demanda.</li>
                        <li><strong>Unidade de Medida:</strong> Confira se está pedindo em 'unidade', 'kg' ou 'm²' para evitar erros na entrega.</li>
                    </ul>
                </ModuleCard>

                <ModuleCard
                    number="05"
                    title="Formalização do Pedido"
                    icon={<DollarIcon className="w-6 h-6" />}
                >
                    <p>Ganhou a cotação? Agora é hora de agir fora do sistema para concluir o processo:</p>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
                        <p className="text-amber-800 font-bold text-xs uppercase mb-2 flex items-center gap-1">
                            <LockClosedIcon className="w-3 h-3" /> Instrução Processual
                        </p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Ao finalizar a demanda com vencedor definido, o processo será enviado para a sua Secretaria providenciar a <strong>Inexigibilidade de Licitação</strong>, conforme o <strong>Art. 79, inciso III, da Lei nº 14.133/21</strong>.
                        </p>
                    </div>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Gere o <strong>PDF do Relatório</strong> de Demanda.</li>
                        <li>Anexe ao seu processo de solicitação de empenho e inexigibilidade.</li>
                        <li>Contate o fornecedor para alinhar a logística.</li>
                    </ol>
                </ModuleCard>

                <ModuleCard
                    number="06"
                    title="Sigilo e Isonomia"
                    icon={<LockClosedIcon className="w-6 h-6" />}
                >
                    <p>Para garantir que ninguém seja favorecido:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Análise Cega:</strong> Durante a cotação, ninguém na prefeitura vê quem enviou o preço.</li>
                        <li><strong>Imparcialidade:</strong> O sistema ranqueia os preços de forma automática.</li>
                        <li><strong>Transparência:</strong> Após o vencedor ser definido, qualquer cidadão pode consultar o resultado no Portal.</li>
                    </ul>
                </ModuleCard>
            </div>

            <div className="bg-blue-600 rounded-3xl p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-xl">
                    <h3 className="text-2xl font-bold mb-2">Dúvidas Técnicas ou Suporte?</h3>
                    <p className="text-blue-100">Se você encontrou algum erro no sistema ou precisa de ajuda para cadastrar um item novo, entre em contato com o Departamento de Contratações.</p>
                </div>
                <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
                    Falar com o Suporte
                </button>
            </div>

            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default TrainingPage;
