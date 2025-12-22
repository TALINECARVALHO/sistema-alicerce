
import React, { useState } from 'react';
import { 
    ClipboardListIcon, 
    UserIcon, 
    LockClosedIcon, 
    SearchIcon, 
    CheckCircleIcon, 
    DollarIcon, 
    BellIcon,
    TruckIcon,
    QAIcon
} from './icons';

const ManualSection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    isOpen: boolean; 
    onToggle: () => void; 
    children: React.ReactNode 
}> = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm transition-all duration-300">
        <button 
            onClick={onToggle}
            className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? 'bg-blue-50 text-blue-800' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {icon}
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        {isOpen && (
            <div className="p-6 border-t border-slate-100 bg-white text-slate-600 leading-relaxed space-y-4">
                {children}
            </div>
        )}
    </div>
);

const SupplierManual: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [openSection, setOpenSection] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenSection(openSection === index ? null : index);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Manual do Fornecedor</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Guia completo para utilizar o Sistema Alicerce, desde o cadastro até o envio de propostas e acompanhamento de resultados.
                </p>
                <button onClick={onBack} className="mt-6 text-blue-600 hover:text-blue-800 font-medium underline">
                    Voltar ao Início
                </button>
            </div>

            <div className="space-y-2">
                {/* Seção 1: Cadastro */}
                <ManualSection 
                    title="1. Como realizar o Pré-Cadastro" 
                    icon={<TruckIcon />} 
                    isOpen={openSection === 0} 
                    onToggle={() => toggle(0)}
                >
                    <p>Para participar das cotações, sua empresa precisa estar credenciada. Siga os passos:</p>
                    <ol className="list-decimal pl-5 space-y-2 marker:font-bold marker:text-slate-400">
                        <li>Na tela inicial, clique no botão <strong>"Sou Fornecedor"</strong> ou <strong>"Quero me Cadastrar"</strong>.</li>
                        <li>Preencha o formulário com os dados da empresa (Razão Social, CNPJ, Contatos).</li>
                        <li>Informe os <strong>Dados Bancários</strong> corretamente para futuros pagamentos.</li>
                        <li>
                            <strong>Grupos de Interesse:</strong> Selecione as categorias que sua empresa fornece (ex: Materiais de Construção, Serviços Elétricos). 
                            <em className="block text-sm text-amber-600 mt-1 bg-amber-50 p-2 rounded">Nota: Você só receberá notificações de cotações dos grupos que selecionar aqui.</em>
                        </li>
                        <li>
                            <strong>Documentação:</strong> Faça o upload dos arquivos exigidos (Cartão CNPJ, CNDs, etc.). Verifique a data de validade dos documentos.
                        </li>
                        <li>Clique em "Enviar Cadastro". Sua solicitação será analisada pela equipe da Prefeitura.</li>
                    </ol>
                </ManualSection>

                {/* Seção 2: Acesso */}
                <ManualSection 
                    title="2. Primeiro Acesso e Login" 
                    icon={<LockClosedIcon />} 
                    isOpen={openSection === 1} 
                    onToggle={() => toggle(1)}
                >
                    <p>Após a aprovação do seu cadastro:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Você receberá um e-mail automático contendo suas credenciais provisórias.</li>
                        <li>Acesse o sistema clicando em <strong>"Área Restrita"</strong> no topo da página.</li>
                        <li>Insira o e-mail cadastrado e a senha recebida.</li>
                        <li>Recomendamos fortemente alterar sua senha no primeiro acesso clicando no seu nome no canto superior direito e selecionando <strong>"Alterar Senha"</strong>.</li>
                    </ul>
                </ManualSection>

                {/* Seção 3: Painel e Oportunidades */}
                <ManualSection 
                    title="3. Painel e Oportunidades" 
                    icon={<BellIcon />} 
                    isOpen={openSection === 2} 
                    onToggle={() => toggle(2)}
                >
                    <p>Ao fazer login, você verá o <strong>Dashboard do Fornecedor</strong>:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Novas Oportunidades:</strong> Destaque para cotações abertas compatíveis com seus grupos que você ainda não respondeu.</li>
                        <li><strong>Cards de Status:</strong> Resumo de quantas propostas você enviou, quantos contratos ganhou e valores acumulados.</li>
                        <li>
                            Para ver detalhes, clique em qualquer card ou acesse o menu lateral <strong>"Oportunidades"</strong>.
                        </li>
                    </ul>
                </ManualSection>

                {/* Seção 4: Enviando Proposta */}
                <ManualSection 
                    title="4. Como Enviar uma Proposta" 
                    icon={<DollarIcon />} 
                    isOpen={openSection === 3} 
                    onToggle={() => toggle(3)}
                >
                    <p>Este é o processo principal do sistema:</p>
                    <ol className="list-decimal pl-5 space-y-3 marker:font-bold marker:text-blue-500">
                        <li>Na lista de oportunidades, clique em uma demanda com status <strong>"Em Cotação"</strong>.</li>
                        <li>Leia atentamente a descrição e os itens solicitados.</li>
                        <li>
                            No formulário de proposta:
                            <ul className="list-disc pl-5 mt-1 text-sm text-slate-500">
                                <li>Informe a <strong>Marca/Fabricante</strong> do produto ofertado.</li>
                                <li>Informe o <strong>Preço Unitário</strong>. O sistema calcula o total automaticamente.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Prazo de Entrega:</strong> Selecione se aceita o prazo do edital ou se pode entregar em menos tempo (isso pode ser um critério de desempate).
                        </li>
                        <li>Adicione observações se necessário (ex: validade da proposta, detalhes técnicos).</li>
                        <li>Clique em <strong>"Enviar Proposta"</strong>. Você receberá um número de protocolo.</li>
                    </ol>
                    <div className="bg-blue-50 p-3 rounded mt-3 text-sm text-blue-800">
                        <strong>Dica:</strong> Se você não tiver interesse ou estoque para uma demanda específica, clique no botão <strong>"Declinar Oportunidade"</strong> para removê-la da sua lista de pendências.
                    </div>
                </ManualSection>

                {/* Seção 5: Dúvidas */}
                <ManualSection 
                    title="5. Tirando Dúvidas" 
                    icon={<QAIcon />} 
                    isOpen={openSection === 4} 
                    onToggle={() => toggle(4)}
                >
                    <p>Não envie proposta se tiver dúvidas sobre o objeto da compra!</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Dentro da tela da demanda, role até a seção <strong>"Dúvidas e Respostas"</strong>.</li>
                        <li>Digite sua pergunta e clique em enviar.</li>
                        <li>O Departamento de Compras responderá pelo sistema. Você poderá ver a resposta na mesma tela ou no menu "Minhas Dúvidas".</li>
                        <li><strong>Atenção:</strong> Enquanto houver dúvidas pendentes de resposta, o envio de propostas pode ficar temporariamente bloqueado para garantir isonomia.</li>
                    </ul>
                </ManualSection>

                {/* Seção 6: Resultados */}
                <ManualSection 
                    title="6. Acompanhando Resultados" 
                    icon={<CheckCircleIcon />} 
                    isOpen={openSection === 5} 
                    onToggle={() => toggle(5)}
                >
                    <p>Após o encerramento do prazo de cotação:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>O status da demanda mudará para <strong>"Em Análise"</strong>.</li>
                        <li>A Prefeitura analisará as propostas (nesta etapa, os nomes dos fornecedores são ocultos para garantir imparcialidade).</li>
                        <li>Se você for o vencedor, o status mudará para <strong>"Vencedor"</strong> e você receberá uma notificação por e-mail para formalização.</li>
                        <li>Você pode consultar todo seu histórico no menu <strong>"Meus Relatórios"</strong>.</li>
                    </ul>
                </ManualSection>
            </div>
        </div>
    );
};

export default SupplierManual;
