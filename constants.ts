
import { DemandStatus, Priority } from './types';

export const STATUS_COLORS: { [key in DemandStatus]: { bg: string, text: string, border: string } } = {
  [DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO]: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  [DemandStatus.AGUARDANDO_PROPOSTA]: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
  [DemandStatus.EM_ANALISE]: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  [DemandStatus.VENCEDOR_DEFINIDO]: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  [DemandStatus.CONCLUIDA]: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-300' },
  [DemandStatus.REPROVADA]: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300' },
  [DemandStatus.CANCELADA]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  [DemandStatus.RASCUNHO]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  [DemandStatus.FECHADA]: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-300' },
};

export const PRIORITY_COLORS: { [key in Priority]: string } = {
    [Priority.BAIXA]: 'bg-gray-100 text-gray-800',
    [Priority.MEDIA]: 'bg-blue-100 text-blue-800',
    [Priority.URGENTE]: 'bg-red-100 text-red-800',
};

// Configuração de prazos separada por TIPO (Materiais vs Serviços)
// proposalDays: Prazo para cotação
// deliveryDays: Prazo para entrega/execução
export const DEADLINE_RULES = {
    'Materiais': {
        [Priority.URGENTE]: { proposalDays: 1, deliveryDays: 1 },
        [Priority.MEDIA]: { proposalDays: 3, deliveryDays: 3 }, // Antiga Normal
        [Priority.BAIXA]: { proposalDays: 5, deliveryDays: 5 },
    },
    'Serviços': {
        [Priority.URGENTE]: { proposalDays: 1, deliveryDays: 2 },
        [Priority.MEDIA]: { proposalDays: 3, deliveryDays: 5 }, // Antiga Normal
        [Priority.BAIXA]: { proposalDays: 5, deliveryDays: 10 },
    }
};

/**
 * Calculates a future date by adding a specified number of business days (Mon-Fri).
 * Skips weekends.
 * @param startDate The starting date.
 * @param days The number of business days to add.
 * @returns The new date.
 */
export const addBusinessDays = (startDate: Date, days: number): Date => {
    const date = new Date(startDate);
    let added = 0;
    while (added < days) {
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            added++;
        }
    }
    return date;
};


export const DEPARTMENTS = [
  'Administração',
  'Agricultura',
  'Desenvolvimento Social',
  'Educação',
  'Esporte',
  'Estradas',
  'Fazenda',
  'Gabinete',
  'Meio Ambiente',
  'Obras',
  'Planejamento',
  'Saúde',
  'Segurança Pública',
  'Turismo',
];

export const UNITS_OF_MEASURE = [
    'un', // Unidade
    'm',  // Metro
    'kg', // Quilograma
    'pç', // Peça
    'cx', // Caixa
    'l',  // Litro
    'm²', // Metro Quadrado
    'm³'  // Metro Cúbico
];
