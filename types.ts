
export enum UserRole {
    SECRETARIA = 'Secretaria Solicitante',
    ALMOXARIFADO = 'Almoxarifado',
    CONTRATACOES = 'Departamento de Contratações',
    GESTOR_SUPREMO = 'super_admin',
    ADMIN = 'Administrador',
    FORNECEDOR = 'Fornecedor',
    CIDADAO = 'Cidadão (Transparência)',
}

export enum DemandStatus {
    AGUARDANDO_ANALISE_ALMOXARIFADO = 'Aguardando Análise Almoxarifado',
    AGUARDANDO_PROPOSTA = 'Em Cotação',
    EM_ANALISE = 'Em Análise',
    VENCEDOR_DEFINIDO = 'Vencedor Definido',
    CONCLUIDA = 'Concluída',
    REPROVADA = 'Reprovada',
    CANCELADA = 'Cancelada',
    RASCUNHO = 'Rascunho',
    FECHADA = 'Fechada'
}

export enum Priority {
    BAIXA = 'Baixa',
    MEDIA = 'Média',
    URGENTE = 'Urgente'
}

export type Item = {
    id: number;
    description: string;
    unit: string;
    quantity: number;
    group_id: string;
    catalog_item_id: string | null;
};

export type ProposalItem = {
    itemId: number;
    unitPrice: number;
    brand?: string;
    observations?: string;
};

export type Proposal = {
    id: number;
    protocol: string;
    supplierId: number;
    supplierName: string; // denormalized for easier access
    deliveryTime: string;
    items: ProposalItem[];
    submittedAt: string;
    totalValue?: number;
    observations?: string;
};

export type Question = {
    id: number;
    supplier_id: number;
    supplierName: string;
    question: string;
    askedAt: string;
    answer: string | null;
    answeredAt: string | null;
    answeredBy: string | null;
}

export type AuditLog = {
    id: number;
    entity_id: string | number; // ID of Demand or Supplier
    entity_type: 'DEMAND' | 'SUPPLIER' | 'USER';
    action: string;
    performed_by: string;
    timestamp: string;
    details?: string;
}

export type Notification = {
    id: string;
    userId: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    link?: string;
}

export type Demand = {
    id: number;
    protocol: string;
    title: string;
    requestingDepartment: string;
    sector: string;
    contactEmail: string;
    type: 'Materiais' | 'Serviços';
    deliveryLocation: string;
    priority: Priority;
    requestDescription: string;

    // Budget Control
    costCenter?: string;
    budgetCode?: string;

    items: Item[];
    status: DemandStatus;
    proposals: Proposal[];
    questions: Question[];
    winner: {
        mode?: 'global' | 'item';
        supplierName?: string;
        totalValue: number;
        justification?: string;
        items?: {
            itemId: number;
            supplierName: string;
            unitPrice: number;
            quantity: number;
            totalValue: number;
        }[];
    } | null;
    decisionDate: string | null;
    homologatedBy: string | null;
    createdAt: string;
    deadline: string;
    proposalDeadline?: string;
    justification?: string;
    rejectionReason?: string;
    approvalObservations?: string;
    group?: string;

    auditLogs?: AuditLog[]; // Populated on fetch
};

export type SupplierStatus = 'Pendente' | 'Ativo' | 'Reprovado' | 'Inativo';

export type SupplierDocument = {
    name: string;
    fileName: string | null;
    storagePath?: string;
    validityDate?: string; // New field for document expiration
}

export type Supplier = {
    id: number;
    name: string;
    cnpj: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    groups: string[];
    status: SupplierStatus;
    documents?: SupplierDocument[];
    user_id?: string;
    rejection_reason?: string;

    // Banking Data
    pixKey?: string;
    bankName?: string;
    agency?: string;
    accountNumber?: string;
}


export type Group = {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export type CatalogItem = {
    id: string;
    name: string;
    groups: string[];
    unit: string;
    type: 'Material' | 'Serviço';
    createdAt?: string;
}

export type Profile = {
    id: string;
    full_name: string;
    name?: string;
    role: string;
    email?: string;
    department?: string;
    active?: boolean;
}

export type EmailProvider = 'simulated' | 'supabase_edge_function' | 'emailjs';

export type EmailConfig = {
    provider: EmailProvider;
    fromName: string;
    // Dynamic SMTP Configuration (Supabase)
    useCustomSmtp?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    // EmailJS Configuration
    emailjsServiceId?: string;
    emailjsTemplateId?: string;
    emailjsPublicKey?: string;
};

export type EmailTemplate = {
    id: string; // Unique Key (e.g., 'NEW_OPPORTUNITY')
    label: string; // Human readable name
    subject: string;
    body: string; // HTML allowed
    variables: string[]; // List of available variables like {{name}}
}

export interface DashboardStats {
    total: number;
    open: number;
    drafts: number;
    closed: number;
    pendingSuppliers: number;
    activeSuppliers: number;
    totalGroups: number;
    // For Almoxarifado specific view
    pendingApproval?: number;
    approved?: number;
    rejected?: number;
}

export type Page = 'dashboard' | 'groups' | 'suppliers' | 'demands' | 'catalog' | 'qa' | 'transparency' | 'reports' | 'supplier_dashboard' | 'supplier_data' | 'supplier_reports' | 'supplier_qa' | 'users' | 'settings' | 'training' | 'email_templates' | 'audit-logs';
