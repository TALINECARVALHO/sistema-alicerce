import { supabase } from './supabase';
import { DemandStatus, SupplierStatus } from '../types';

export const seedDatabase = async () => {
    console.log("🌱 Starting Database Seed...");

    // 1. Seed Suppliers
    const suppliers = [
        {
            name: "Tech Solutions Ltda",
            fantasy_name: "TechSol",
            cnpj: "12.345.678/0001-90",
            email: "contato@techsol.com.br",
            phone: "(11) 98765-4321",
            status: 'Ativo' // Fixed status
        },
        {
            name: "Distribuidora Serra Grande",
            fantasy_name: "Serra Grande",
            cnpj: "98.765.432/0001-10",
            email: "vendas@serragrande.com.br",
            phone: "(54) 3333-2222",
            status: 'Pendente' // Fixed status
        }
    ];

    for (const sup of suppliers) {
        const { error } = await supabase.from('suppliers').insert([sup]);
        if (error && !error.message.includes('unique')) console.error("Error seeding supplier:", error);
    }

    // 2. Seed Demands
    const demands = [
        {
            protocol: `REQ-SEED-${Math.floor(Math.random() * 1000)}`,
            requesting_department: "Departamento de TI",
            requester_name: "João da Silva",
            object: "Aquisição de Notebooks para o setor administrativo",
            justification: "Necessidade de renovação do parque tecnológico.",
            delivery_location: "Sede Administrativa",
            status: DemandStatus.AGUARDANDO_PROPOSTA,
            created_at: new Date().toISOString(),
            proposal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 days
        },
        {
            protocol: `REQ-SEED-${Math.floor(Math.random() * 1000)}`,
            requesting_department: "Obras e Infraestrutura",
            requester_name: "Maria Oliveira",
            object: "Cimento e Areia para reparos nas calçadas",
            justification: "Manutenção rotineira das vias públicas.",
            delivery_location: "Almoxarifado Central",
            status: DemandStatus.RASCUNHO,
            created_at: new Date().toISOString()
        }
    ];

    for (const dem of demands) {
        const { error } = await supabase.from('demands').insert([dem]);
        if (error) console.error("Error seeding demand:", error);
    }

    console.log("✅ Database Seed Completed!");
    return true;
};
