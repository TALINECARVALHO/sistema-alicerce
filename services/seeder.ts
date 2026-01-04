import { supabase } from './supabase';
import { DemandStatus, SupplierStatus } from '../types';

export const seedDatabase = async () => {
    console.log("🌱 Starting Database Seed...");

    // 1. Seed Suppliers
    const suppliers = [
        {
            name: "Tech Solutions Ltda",
            cnpj: "12.345.678/0001-90",
            email: "contato@techsol.com.br",
            phone: "(11) 98765-4321",
            status: 'Ativo',
            groups: ['TI', 'Eletrônicos'],
            contact_person: 'Carlos Tech'
        },
        {
            name: "Distribuidora Serra Grande",
            cnpj: "98.765.432/0001-10",
            email: "vendas@serragrande.com.br",
            phone: "(54) 3333-2222",
            status: 'Pendente',
            groups: ['Obras', 'Construção'],
            contact_person: 'Ana Serra'
        }
    ];

    for (const sup of suppliers) {
        // Try to find existing by email to avoid unique constraint errors manually
        const { data: existing } = await supabase.from('suppliers').select('id').eq('email', sup.email).single();

        if (existing) {
            // Update existing
            const { error } = await supabase.from('suppliers').update(sup).eq('id', existing.id);
            if (error) {
                console.error("Error updating existing seed supplier:", error);
                throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
            }
        } else {
            // Insert new
            const { error } = await supabase.from('suppliers').insert([sup]);
            if (error) {
                console.error("Error seeding supplier:", error);
                throw new Error(`Erro ao criar fornecedor: ${error.message}`);
            }
        }
    }

    // 2. Seed Demands
    const demands = [
        {
            protocol: `REQ-SEED-${Math.floor(Math.random() * 1000)}`,
            title: "Aquisição de Notebooks", // Added Title
            requesting_department: "Administração", // Fixed: Valid Department
            request_description: "Aquisição de Notebooks para o setor administrativo",
            justification: "Necessidade de renovação do parque tecnológico.",
            delivery_location: "Sede Administrativa",
            status: DemandStatus.AGUARDANDO_PROPOSTA,
            created_at: new Date().toISOString(),
            proposal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 days
        },
        {
            protocol: `REQ-SEED-${Math.floor(Math.random() * 1000)}`,
            title: "Reparo de Calçadas", // Added Title
            requesting_department: "Obras", // Fixed: Valid Department
            request_description: "Cimento e Areia para reparos nas calçadas",
            justification: "Manutenção rotineira das vias públicas.",
            delivery_location: "Almoxarifado Central",
            status: DemandStatus.RASCUNHO,
            created_at: new Date().toISOString()
        }
    ];

    for (const dem of demands) {
        const { data: createdDemand, error } = await supabase.from('demands').insert([dem]).select().single();
        if (error) {
            console.error("Error seeding demand:", error);
            throw new Error(`Erro ao criar demanda: ${error.message}`);
        }

        if (createdDemand) {
            const items = [];
            if (createdDemand.title === "Aquisição de Notebooks") {
                items.push({ demand_id: createdDemand.id, description: "Notebook Core i7 16GB", unit: "UN", quantity: 5, group_id: "1" });
                items.push({ demand_id: createdDemand.id, description: "Mouse Sem Fio", unit: "UN", quantity: 5, group_id: "1" });
            } else {
                items.push({ demand_id: createdDemand.id, description: "Saco de Cimento 50kg CP II", unit: "SC", quantity: 20, group_id: "3" });
                items.push({ demand_id: createdDemand.id, description: "Areia Média Lavada", unit: "M3", quantity: 5, group_id: "3" });
            }

            if (items.length > 0) {
                const { error: itemError } = await supabase.from('items').insert(items);
                if (itemError) {
                    console.error("Error seeding items:", itemError);
                    throw new Error(`Erro ao criar itens da demanda: ${itemError.message}`);
                }
            }
        }
    }

    console.log("✅ Database Seed Completed!");
    return true;
};

export const clearDatabase = async () => {
    console.log("🔥 Clearing Database...");

    // Delete in order to respect FK constraints (if not cascade)
    await supabase.from('items').delete().neq('id', 0);
    await supabase.from('proposals').delete().neq('id', 0);
    await supabase.from('questions').delete().neq('id', 0);
    await supabase.from('demands').delete().neq('id', 0);

    // Note: Deleting suppliers might fail if they have linked users/auth or other constraints, 
    // but for this simple test env it should be fine.
    await supabase.from('suppliers').delete().neq('id', 0);

    console.log("✅ Database Cleared!");
};

export const resetDatabase = async () => {
    await clearDatabase();
    await seedDatabase();
    return true;
};
