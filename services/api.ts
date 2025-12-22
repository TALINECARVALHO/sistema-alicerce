
import { supabase } from './supabase';
import { Supplier, Demand, DemandStatus, Group, Profile, CatalogItem, UserRole, Question, EmailTemplate } from '../types';
import { sendEmail } from './emailService';
export { sendEmail };

// --- Helpers ---

export const formatError = (err: any): string => {
    if (!err) return "Erro desconhecido";
    if (typeof err === 'string') return err;
    if (err.context?.error?.message) return String(err.context.error.message);
    if (err.message && typeof err.message === 'string') {
        if (err.message.includes("User already registered")) return "Este e-mail já está cadastrado no sistema.";
        return err.message;
    }
    if (err.error_description) return String(err.error_description);
    if (err.error?.message) return String(err.error.message);
    return String(err);
};

/**
 * Converte o objeto cru do banco de dados (Supabase) para o formato esperado pelo Frontend.
 * Resolve a inconsistência entre snake_case (banco) e camelCase (código).
 */
export const mapDemand = (d: any): Demand => ({
    ...d,
    createdAt: d.createdAt || d.created_at,
    proposalDeadline: d.proposalDeadline || d.proposal_deadline,
    deadline: d.deadline || d.proposal_deadline || d.proposalDeadline, // Fallback se o campo estiver vazio
    decisionDate: d.decision_date || d.decisionDate,
    homologatedBy: d.homologated_by || d.homologatedBy,
    requestingDepartment: d.requestingDepartment || d.requesting_department,
    deliveryLocation: d.deliveryLocation || d.delivery_location,
    contactEmail: d.contactEmail || d.contact_email,
    requestDescription: d.requestDescription || d.request_description,
    approvalObservations: d.approval_observations || d.approvalObservations,
    rejectionReason: d.rejection_reason || d.rejectionReason
});

export const checkDatabaseHealth = async (): Promise<{ templates: boolean; logs: boolean }> => {
    const status = { templates: false, logs: false };
    try {
        const { error: tErr } = await supabase.from('email_templates').select('id', { count: 'exact', head: true }).limit(1);
        status.templates = !tErr;
        const { error: lErr } = await supabase.from('email_logs').select('id', { count: 'exact', head: true }).limit(1);
        status.logs = !lErr;
    } catch (e) { }
    return status;
};

// --- Suppliers ---

export const fetchSuppliers = async (): Promise<Supplier[]> => {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) return [];
    return data as Supplier[];
};

export const fetchSupplierById = async (id: number): Promise<Supplier | null> => {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (error) return null;
    return data as Supplier;
};

export const deleteSupplier = async (id: number): Promise<void> => {
    const { data: supplier } = await supabase.from('suppliers').select('user_id').eq('id', id).single();
    await supabase.from('suppliers').delete().eq('id', id);
    if (supplier?.user_id) {
        try { await deleteSystemUser(supplier.user_id); } catch (e) { }
    }
};

export const getSupplierDocumentUrl = async (path: string): Promise<string | null> => {
    try {
        console.log('🔗 Gerando URL para:', path);

        // For public buckets, we need to verify the file exists first
        // because getPublicUrl always returns a URL even if file doesn't exist
        const { data: listData, error: listError } = await supabase.storage
            .from('supplier-documents')
            .list(path.split('/')[0], {
                search: path.split('/')[1]
            });

        if (listError) {
            console.error('❌ Erro ao verificar arquivo:', listError);
            // If we can't list, try signed URL (might be private bucket)
            const { data, error } = await supabase.storage
                .from('supplier-documents')
                .createSignedUrl(path, 3600);

            if (error) {
                console.error('❌ Erro ao criar URL assinada:', error);
                return null;
            }

            console.log('✅ URL assinada gerada:', data.signedUrl);
            return data.signedUrl;
        }

        // Check if file exists in the list
        const fileExists = listData && listData.length > 0;

        if (!fileExists) {
            console.error('❌ Arquivo não encontrado no Storage:', path);
            return null;
        }

        // File exists, get public URL
        const { data: publicData } = supabase.storage
            .from('supplier-documents')
            .getPublicUrl(path);

        if (publicData?.publicUrl) {
            console.log('✅ URL pública gerada:', publicData.publicUrl);
            return publicData.publicUrl;
        }

        console.error('❌ Não foi possível gerar URL');
        return null;
    } catch (e) {
        console.error('💥 Exceção ao gerar URL:', e);
        return null;
    }
};

const uploadSupplierFile = async (supplierId: number, file: File): Promise<string | null> => {
    try {
        console.log('📤 Iniciando upload:', { supplierId, fileName: file.name, fileSize: file.size });

        // Sanitize filename
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${supplierId}/${Date.now()}_${cleanName}`;

        console.log('📂 Path do arquivo:', path);

        // Use upsert to avoid conflicts and set upsert to true
        const { data, error } = await supabase.storage
            .from('supplier-documents')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Erro no upload:', error);

            // Try alternative approach: use public bucket upload
            console.log('🔄 Tentando abordagem alternativa...');
            const { data: data2, error: error2 } = await supabase.storage
                .from('supplier-documents')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true // Allow overwrite
                });

            if (error2) {
                console.error('❌ Erro na segunda tentativa:', error2);
                return null;
            }

            console.log('✅ Upload bem-sucedido (segunda tentativa):', { path, data: data2 });
            return path;
        }

        console.log('✅ Upload bem-sucedido:', { path, data });
        return path;
    } catch (e) {
        console.error('💥 Exceção no upload:', e);
        return null;
    }
};

export const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'status'>, files?: Record<string, File | null>): Promise<Supplier> => {
    console.log('🏢 Criando fornecedor:', { name: supplierData.name, hasFiles: !!files, fileCount: files ? Object.keys(files).length : 0 });

    // 1. Initial insert to get ID
    const payload = { ...supplierData, status: 'Pendente' };
    const { data: initialData, error } = await supabase.from('suppliers').insert([payload]).select().single();

    if (error) throw error;

    let supplier = initialData as Supplier;
    console.log('✅ Fornecedor criado com ID:', supplier.id);

    // 2. Upload files if present
    if (files && Object.keys(files).length > 0) {
        console.log('📁 Processando arquivos...', Object.keys(files));
        const updatedDocuments = [...(supplier.documents || [])];
        let hasChanges = false;

        for (const [docName, file] of Object.entries(files)) {
            if (file) {
                console.log(`📄 Fazendo upload de: ${docName}`);
                const path = await uploadSupplierFile(supplier.id, file);
                if (path) {
                    const docIndex = updatedDocuments.findIndex(d => d.name === docName);
                    if (docIndex >= 0) {
                        updatedDocuments[docIndex] = {
                            ...updatedDocuments[docIndex],
                            storagePath: path,
                            fileName: file.name,
                            // Set validity date to 1 year from now if not present, as a default
                            validityDate: updatedDocuments[docIndex].validityDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
                        };
                    } else {
                        updatedDocuments.push({
                            name: docName,
                            fileName: file.name,
                            storagePath: path,
                            validityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
                        });
                    }
                    hasChanges = true;
                    console.log(`✅ Arquivo ${docName} salvo em: ${path}`);
                } else {
                    console.error(`❌ Falha ao fazer upload de: ${docName}`);
                }
            }
        }

        if (hasChanges) {
            console.log('💾 Atualizando documentos no banco...', updatedDocuments);
            const { data: updatedData, error: updateError } = await supabase
                .from('suppliers')
                .update({ documents: updatedDocuments })
                .eq('id', supplier.id)
                .select()
                .single();

            if (!updateError && updatedData) {
                supplier = updatedData as Supplier;
                console.log('✅ Documentos atualizados no banco');
            } else {
                console.error('❌ Erro ao atualizar documentos:', updateError);
            }
        }
    } else {
        console.log('⚠️ Nenhum arquivo para fazer upload');
    }

    return supplier;
};

export const updateSupplier = async (supplier: Supplier, files?: Record<string, File | null>): Promise<Supplier> => {
    // 1. Upload new files if present
    let updatedSupplier = { ...supplier };

    if (files && Object.keys(files).length > 0) {
        const updatedDocuments = [...(updatedSupplier.documents || [])];
        let hasChanges = false;

        for (const [docName, file] of Object.entries(files)) {
            if (file) {
                const path = await uploadSupplierFile(supplier.id, file);
                if (path) {
                    const docIndex = updatedDocuments.findIndex(d => d.name === docName);
                    if (docIndex >= 0) {
                        updatedDocuments[docIndex] = {
                            ...updatedDocuments[docIndex],
                            storagePath: path,
                            fileName: file.name
                        };
                    } else {
                        updatedDocuments.push({
                            name: docName,
                            fileName: file.name,
                            storagePath: path
                        });
                    }
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) {
            updatedSupplier.documents = updatedDocuments;
        }
    }

    // 2. Update record
    const { data, error } = await supabase.from('suppliers').update(updatedSupplier).eq('id', supplier.id).select().single();
    if (error) throw error;
    return data as Supplier;
};

export const rejectSupplier = async (supplierId: number, reason: string) => {
    await supabase.from('suppliers').update({ status: 'Reprovado', rejection_reason: reason }).eq('id', supplierId);
    const { data: supplier } = await supabase.from('suppliers').select('email, name').eq('id', supplierId).single();
    if (supplier?.email) {
        const { subject, html } = await getEmailContent('SUPPLIER_REJECTED', { '{{supplierName}}': supplier.name, '{{reason}}': reason });
        await sendEmail(supplier.email, subject, html);
    }
};

export const linkUserToSupplier = async (userId: string, supplierId: number) => {
    await supabase.from('suppliers').update({ user_id: userId }).eq('id', supplierId);
};

// --- Email Templates ---

export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id'>[] = [
    {
        label: 'Fornecedor Aprovado',
        subject: 'Cadastro Aprovado - Sistema Alicerce',
        body: `
            <p>Olá,</p>
            <p>Informamos que o cadastro da empresa <b>{{supplierName}}</b> foi <b>aprovado</b> e que ela já se encontra <b>credenciada no Sistema Alicerce</b>, plataforma oficial da Prefeitura de São Francisco de Paula/RS para gestão das contratações públicas.</p>
            <p><b>Dados de acesso:</b></p>
            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: sans-serif;">
                <li>• <b>Sistema:</b> <a href="https://sistemaalicerce.netlify.app" style="color: #2563eb; text-decoration: none;">https://sistemaalicerce.netlify.app</a></li>
                <li>• <b>Login:</b> {{email}}</li>
                <li>• <b>Senha provisória:</b> <code>{{password}}</code></li>
            </ul>
            <p>Por segurança, recomendamos <b>alterar a senha no primeiro acesso</b>.</p>
            <p>Em caso de dúvidas ou dificuldades, entre em contato com o Departamento de Contratações Públicas.</p>
            <p style="margin-top: 20px;">Atenciosamente,<br><b>Sistema Alicerce</b><br>Prefeitura de São Francisco de Paula/RS</p>
        `,
        variables: ['{{supplierName}}', '{{email}}', '{{password}}']
    },
    {
        label: 'Fornecedor Rejeitado',
        subject: 'Cadastro Reprovado - Sistema Alicerce',
        body: `
            <p>Olá, <b>{{supplierName}}</b>,</p>
            <p>Após análise das informações e documentos enviados, informamos que o <b>cadastro da sua empresa não foi aprovado</b> no <b>Sistema Alicerce</b>, no momento.</p>
            <p><b>Motivo da rejeição:</b><br>{{reason}}</p>
            <p>O fornecedor poderá <b>regularizar as pendências e realizar novo envio</b> pelo sistema, observando as orientações indicadas acima.</p>
            <p>Para mais detalhes ou para reenviar a documentação, acesse o Sistema Alicerce.</p>
            <p style="margin-top: 20px;">Atenciosamente,<br><b>Sistema Alicerce</b><br>Prefeitura de São Francisco de Paula/RS</p>
        `,
        variables: ['{{supplierName}}', '{{reason}}']
    },
    {
        label: 'Nova Oportunidade',
        subject: 'Nova Cotação Aberta: {{demandTitle}}',
        body: `
            <p>Olá, <b>{{supplierName}}</b>,</p>
            <p>Uma <b>nova demanda compatível com a sua área de atuação</b> foi aberta no <b>Sistema Alicerce</b>.</p>
            <p><b>Detalhes da demanda:</b></p>
            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: sans-serif;">
                <li>• <b>Protocolo:</b> {{protocol}}</li>
                <li>• <b>Objeto:</b> {{demandTitle}}</li>
                <li>• <b>Prazo para envio da cotação:</b> <b>{{deadline}}</b></li>
            </ul>
            <p>Para visualizar os detalhes e <b>registrar sua cotação</b>, acesse o sistema pelo link abaixo:</p>
            <p style="margin: 25px 0;">
                👉 <a href="https://sistemaalicerce.netlify.app" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-family: sans-serif;">Acessar o Sistema Alicerce e Cotar</a>
            </p>
            <p>Em caso de dúvidas, utilize os canais de atendimento disponíveis na plataforma.</p>
            <p style="margin-top: 30px;">Atenciosamente,<br><b>Sistema Alicerce</b><br><small>Prefeitura de São Francisco de Paula/RS</small></p>
        `,
        variables: ['{{supplierName}}', '{{demandTitle}}', '{{protocol}}', '{{deadline}}']
    },
    {
        label: 'Nova Dúvida Registrada',
        subject: 'Nova Dúvida na Demanda {{demandTitle}}',
        body: `
            <p>Olá,</p>
            <p>Uma <b>nova dúvida foi registrada</b> no <b>Sistema Alicerce</b> referente à demanda abaixo:</p>
            <p><b>Detalhes:</b></p>
            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: sans-serif;">
                <li>• <b>Demanda:</b> {{demandTitle}}</li>
                <li>• <b>Fornecedor:</b> {{supplierName}}</li>
            </ul>
            <p><b>Mensagem do fornecedor:</b><br>“{{questionText}}”</p>
            <p>Para visualizar o contexto completo e <b>responder à dúvida</b>, acesse o sistema.</p>
            <p style="margin-top: 20px;">Atenciosamente,<br><b>Sistema Alicerce</b><br>Prefeitura de São Francisco de Paula/RS</p>
        `,
        variables: ['{{demandTitle}}', '{{supplierName}}', '{{questionText}}']
    },
    {
        label: 'Resposta da Dúvida',
        subject: 'Dúvida Respondida: {{demandTitle}}',
        body: `
            <p>Olá, <b>{{supplierName}}</b>,</p>
            <p>A Prefeitura de São Francisco de Paula respondeu à dúvida registrada no <b>Sistema Alicerce</b>, conforme detalhes abaixo:</p>
            <p><b>Demanda:</b> {{demandTitle}}<br>
            <b>Protocolo:</b> {{protocol}}</p>
            <p><b>Resposta da Administração:</b><br>“{{answerText}}”</p>
            <p>Para consultar o histórico completo da demanda ou registrar nova manifestação, acesse o sistema pelo link abaixo:</p>
            <p style="margin: 25px 0;">
                👉 <a href="https://sistemaalicerce.netlify.app" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-family: sans-serif;">Acessar o Sistema Alicerce</a>
            </p>
            <p style="margin-top: 30px;">Atenciosamente,<br><b>Sistema Alicerce</b><br><small>Prefeitura de São Francisco de Paula/RS</small></p>
        `,
        variables: ['{{supplierName}}', '{{demandTitle}}', '{{protocol}}', '{{answerText}}']
    },
    {
        label: 'Proposta Vencedora',
        subject: 'Proposta Selecionada - Sistema Alicerce',
        body: `
            <p>Olá, <b>{{supplierName}}</b>,</p>
            <p>Informamos que sua proposta foi <b>selecionada como vencedora</b> na cotação realizada pelo <b>Sistema Alicerce</b>.</p>
            <p><b>Detalhes:</b></p>
            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: sans-serif;">
                <li>• <b>Demanda:</b> {{demandTitle}}</li>
                <li>• <b>Protocolo:</b> {{protocol}}</li>
                <li>• <b>Prazo/Condições:</b> {{conditions}}</li>
            </ul>
            <p>Para consultar o resultado e os próximos passos (documentação, assinatura e/ou emissão de empenho), acesse o sistema:</p>
            <p style="margin: 25px 0;">
                👉 <a href="https://sistemaalicerce.netlify.app" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-family: sans-serif;">Acessar o Sistema Alicerce</a>
            </p>
            <p>Em caso de dúvidas, utilize os canais de atendimento disponíveis na plataforma.</p>
            <p style="margin-top: 30px;">Atenciosamente,<br><b>Sistema Alicerce</b><br><small>Prefeitura de São Francisco de Paula/RS</small></p>
        `,
        variables: ['{{supplierName}}', '{{demandTitle}}', '{{protocol}}', '{{conditions}}']
    },
    {
        label: 'Proposta Não Selecionada',
        subject: 'Resultado da Cotação - Sistema Alicerce',
        body: `
            <p>Olá, <b>{{supplierName}}</b>,</p>
            <p>Agradecemos sua participação. Informamos que, após análise das propostas, sua cotação <b>não foi selecionada</b> para a demanda abaixo.</p>
            <p><b>Detalhes:</b></p>
            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: sans-serif;">
                <li>• <b>Demanda:</b> {{demandTitle}}</li>
                <li>• <b>Protocolo:</b> {{protocol}}</li>
            </ul>
            <p>Você pode consultar o resultado e o histórico da demanda no sistema:</p>
            <p style="margin: 25px 0;">
                👉 <a href="https://sistemaalicerce.netlify.app" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-family: sans-serif;">Acessar o Sistema Alicerce</a>
            </p>
            <p>Agradecemos novamente a colaboração e contamos com sua participação em futuras oportunidades.</p>
            <p style="margin-top: 30px;">Atenciosamente,<br><b>Sistema Alicerce</b><br><small>Prefeitura de São Francisco de Paula/RS</small></p>
        `,
        variables: ['{{supplierName}}', '{{demandTitle}}', '{{protocol}}']
    },
    {
        label: 'Aviso à Secretaria (Vencedor Definido)',
        subject: 'Fornecedor Definido - Demanda {{protocol}}',
        body: `
            <p>Olá, <b>{{departmentName}}</b>,</p>
            <p>Informamos que a <b>demanda solicitada</b> por essa Secretaria teve <b>fornecedor definido</b> no <b>Sistema Alicerce</b>.</p>
            <p><b>Detalhes da demanda:</b></p>
            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: sans-serif;">
                <li>• <b>Demanda/Objeto:</b> {{demandTitle}}</li>
                <li>• <b>Protocolo:</b> {{protocol}}</li>
                <li>• <b>Fornecedor selecionado:</b> {{supplierName}}</li>
                <li>• <b>Valor:</b> {{totalValue}}</li>
            </ul>
            <p>Diante disso, solicitamos que seja <b>providenciado o empenho</b>, conforme os trâmites internos, para dar continuidade ao processo.</p>
            <p>Os documentos e o histórico completo da demanda estão disponíveis no Sistema Alicerce.</p>
            <p style="margin-top: 30px;">Atenciosamente,<br><b>Sistema Alicerce</b><br><small>Prefeitura de São Francisco de Paula/RS</small></p>
        `,
        variables: ['{{departmentName}}', '{{demandTitle}}', '{{protocol}}', '{{supplierName}}', '{{totalValue}}']
    },
    {
        label: 'Redefinição de Senha (Admin)',
        subject: 'Nova Senha de Acesso - Sistema Alicerce',
        body: `
            <p>Olá, <b>{{userName}}</b>,</p>
            <p>Sua senha de acesso ao <b>Sistema Alicerce</b> foi redefinida pelo administrador.</p>
            <p><b>Suas novas credenciais:</b></p>
            <ul style="list-style: none; padding: 0; margin: 15px 0; font-family: sans-serif;">
                <li>• <b>Login:</b> {{email}}</li>
                <li>• <b>Nova Senha:</b> <code>{{password}}</code></li>
            </ul>
            <p>Recomendamos que você altere esta senha após o login, através do menu de Configurações.</p>
            <p style="margin-top: 20px;">Atenciosamente,<br><b>Sistema Alicerce</b><br><small>Prefeitura de São Francisco de Paula/RS</small></p>
        `,
        variables: ['{{userName}}', '{{email}}', '{{password}}']
    }
];

export const getEmailContent = async (templateId: string, replacements: Record<string, string>): Promise<{ subject: string, html: string }> => {
    const { data } = await supabase.from('email_templates').select('*').eq('id', templateId).single();

    // Busca o template padrão na lista se não encontrar no banco
    const fallback = templateId === 'SUPPLIER_APPROVED' ? DEFAULT_TEMPLATES[0] :
        templateId === 'SUPPLIER_REJECTED' ? DEFAULT_TEMPLATES[1] :
            templateId === 'NEW_QUESTION' ? DEFAULT_TEMPLATES[3] :
                templateId === 'QUESTION_ANSWERED' ? DEFAULT_TEMPLATES[4] :
                    templateId === 'PROPOSAL_WINNER' ? DEFAULT_TEMPLATES[5] :
                        templateId === 'PROPOSAL_LOSER' ? DEFAULT_TEMPLATES[6] :
                            templateId === 'WINNER_DEFINED_SECRETARIA' ? DEFAULT_TEMPLATES[7] :
                                templateId === 'PASSWORD_RESET_ADMIN' ? DEFAULT_TEMPLATES[8] :
                                    DEFAULT_TEMPLATES[2];

    let subject = data?.subject || fallback.subject;
    let html = data?.body || fallback.body;

    Object.entries(replacements).forEach(([key, value]) => {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        subject = subject.replace(regex, value || '');
        html = html.replace(regex, value || '');
    });
    return { subject, html };
};

export const fetchEmailLogs = async () => {
    const { data } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(50);
    return data || [];
};

export const fetchEmailTemplates = async (): Promise<EmailTemplate[]> => {
    const { data } = await supabase.from('email_templates').select('*');
    return (data || []) as EmailTemplate[];
};

export const updateEmailTemplate = async (template: EmailTemplate): Promise<void> => {
    await supabase.from('email_templates').upsert([template]);
};

export const seedEmailTemplates = async () => {
    const dataToSeed = [
        { id: 'SUPPLIER_APPROVED', ...DEFAULT_TEMPLATES[0] },
        { id: 'SUPPLIER_REJECTED', ...DEFAULT_TEMPLATES[1] },
        { id: 'NEW_OPPORTUNITY', ...DEFAULT_TEMPLATES[2] },
        { id: 'NEW_QUESTION', ...DEFAULT_TEMPLATES[3] },
        { id: 'QUESTION_ANSWERED', ...DEFAULT_TEMPLATES[4] },
        { id: 'PROPOSAL_WINNER', ...DEFAULT_TEMPLATES[5] },
        { id: 'PROPOSAL_LOSER', ...DEFAULT_TEMPLATES[6] },
        { id: 'WINNER_DEFINED_SECRETARIA', ...DEFAULT_TEMPLATES[7] },
        { id: 'PASSWORD_RESET_ADMIN', ...DEFAULT_TEMPLATES[8] }
    ];
    await supabase.from('email_templates').upsert(dataToSeed, { onConflict: 'id' });
};

// --- Notificar Fornecedores sobre Nova Demanda ---
export const notifySuppliersNewDemand = async (demand: Demand, groups: Group[]) => {
    if (demand.status !== DemandStatus.AGUARDANDO_PROPOSTA) return;

    try {
        // 1. Pegar IDs dos grupos dos itens da demanda
        const demandGroupIds = Array.from(new Set(demand.items.map(i => i.group_id)));
        const demandGroupNames = groups.filter(g => demandGroupIds.includes(g.id)).map(g => g.name);

        // 2. Buscar fornecedores ativos
        const { data: activeSuppliers } = await supabase.from('suppliers').select('*').eq('status', 'Ativo');
        if (!activeSuppliers) return;

        // 3. Filtrar fornecedores que pertencem a esses grupos
        const suppliersToNotify = activeSuppliers.filter(s =>
            s.groups && s.groups.some((gn: string) => demandGroupNames.includes(gn))
        );

        if (suppliersToNotify.length === 0) return;

        // 4. Carregar Template Base
        const { data: templateData } = await supabase.from('email_templates').select('*').eq('id', 'NEW_OPPORTUNITY').single();
        const baseSubject = templateData?.subject || DEFAULT_TEMPLATES[2].subject;
        const baseHtml = templateData?.body || DEFAULT_TEMPLATES[2].body;

        // 5. Disparar e-mails personalizados
        for (const supplier of suppliersToNotify) {
            const replacements: Record<string, string> = {
                '{{supplierName}}': supplier.name,
                '{{demandTitle}}': demand.title,
                '{{protocol}}': demand.protocol,
                '{{deadline}}': demand.proposalDeadline ? new Date(demand.proposalDeadline).toLocaleDateString('pt-BR') : 'A definir'
            };

            let personalizedSubject = baseSubject;
            let personalizedHtml = baseHtml;

            Object.entries(replacements).forEach(([key, value]) => {
                const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                personalizedSubject = personalizedSubject.replace(regex, value || '');
                personalizedHtml = personalizedHtml.replace(regex, value || '');
            });

            await sendEmail(supplier.email, personalizedSubject, personalizedHtml);
        }
    } catch (e) {
        console.error("Erro ao notificar fornecedores:", e);
    }
};

// --- Catalog ---

export const fetchCatalogItems = async (): Promise<CatalogItem[]> => {
    const { data, error } = await supabase.from('catalog_items').select('*').order('name');
    if (error) throw error;
    return data as CatalogItem[];
};

export const createCatalogItem = async (item: Omit<CatalogItem, 'id'>): Promise<CatalogItem> => {
    const { data, error } = await supabase.from('catalog_items').insert([item]).select().single();
    if (error) throw error;
    return data as CatalogItem;
};

export const updateCatalogItem = async (item: CatalogItem): Promise<CatalogItem> => {
    const { data, error } = await supabase.from('catalog_items').update(item).eq('id', item.id).select().single();
    if (error) throw error;
    return data as CatalogItem;
};

export const deleteCatalogItem = async (id: string): Promise<void> => {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) throw error;
};

// --- User & Workflow ---

export const createSystemUser = async (userData: Partial<Profile>, password?: string): Promise<Profile | null> => {
    const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: userData.email, password, userData }
    });
    if (error) throw new Error(formatError(error));
    return data.profile as Profile;
};

export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data as Profile;
};

export const fetchProfiles = async (): Promise<Profile[]> => {
    const { data } = await supabase.from('profiles').select('*');
    return (data || []) as Profile[];
};

export const updateProfile = async (profile: Profile): Promise<Profile> => {
    const { data } = await supabase.from('profiles').update(profile).eq('id', profile.id).select().single();
    return data as Profile;
};

export const deleteSystemUser = async (userId: string) => {
    await supabase.functions.invoke('delete-user', { body: { userId } });
};

export const updateCurrentUserPassword = async (password: string) => {
    await supabase.auth.updateUser({ password });
};

export const resetSystemUserPassword = async (userId: string, email: string, userName: string): Promise<{ success: boolean; message: string }> => {
    const newPassword = Math.random().toString(36).slice(-10) + 'A1!';
    try {
        const { error } = await supabase.functions.invoke('reset-password', {
            body: { userId, password: newPassword }
        });

        if (error) throw error;

        // Send Email
        const { subject, html } = await getEmailContent('PASSWORD_RESET_ADMIN', {
            '{{userName}}': userName,
            '{{email}}': email,
            '{{password}}': newPassword
        });
        await sendEmail(email, subject, html);

        return { success: true, message: "Senha resetada e enviada por e-mail!" };
    } catch (e: any) {
        console.error("Erro ao resetar senha:", e);
        return { success: false, message: "Erro ao processar reset de senha." };
    }
};

export const approveSupplierWorkflow = async (supplier: Supplier): Promise<{ success: boolean; message: string }> => {
    const tempPass = Math.random().toString(36).slice(-10) + 'A1!';
    try {
        const profile = await createSystemUser({
            email: supplier.email,
            full_name: supplier.contactPerson,
            role: UserRole.FORNECEDOR,
            department: supplier.name
        }, tempPass);

        if (!profile) throw new Error("Erro ao criar perfil de autenticação.");

        await supabase.from('suppliers').update({ status: 'Ativo', user_id: profile.id }).eq('id', supplier.id);

        const { subject, html } = await getEmailContent('SUPPLIER_APPROVED', {
            '{{supplierName}}': supplier.name,
            '{{email}}': supplier.email,
            '{{password}}': tempPass
        });
        await sendEmail(supplier.email, subject, html);

        return { success: true, message: "Fornecedor aprovado com sucesso!" };
    } catch (e: any) {
        return { success: false, message: formatError(e) };
    }
};

export const fetchDemands = async (page: number, pageSize: number, filters?: any, supplierGroups?: string[]) => {
    let query = supabase.from('demands').select('*, items(*), proposals(*), questions(*)', { count: 'exact' });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.searchTerm) query = query.ilike('title', `%${filters.searchTerm}%`);

    // Filtro para fornecedores (ver apenas demandas de seus grupos)
    if (supplierGroups && supplierGroups.length > 0) {
        query = query.filter('items.group_id', 'in', `(${supplierGroups.join(',')})`);
    }

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1).order('created_at', { ascending: false });

    if (error) throw error;

    // Converte os dados do banco para o formato camelCase do frontend
    const mappedData = (data || []).map(mapDemand);

    return { data: mappedData, count: count || 0 };
};
// --- Demands CRUD ---

export const deleteDemand = async (id: number): Promise<void> => {
    // First delete related items to satisfy foreign key constraints (if cascade is not set)
    await supabase.from('items').delete().eq('demand_id', id);
    await supabase.from('proposals').delete().eq('demand_id', id);
    await supabase.from('questions').delete().eq('demand_id', id);

    const { error } = await supabase.from('demands').delete().eq('id', id);
    if (error) throw error;
};
