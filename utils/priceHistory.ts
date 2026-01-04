
import { Demand, DemandStatus } from '../types';

export interface PriceHistoryEntry {
    date: string;
    supplierName: string;
    unitPrice: number;
    protocol: string;
}

export function getPriceHistory(description: string, catalogItemId: string | null | undefined, demands: Demand[]): PriceHistoryEntry[] {
    const matches: PriceHistoryEntry[] = [];

    if (!demands || !Array.isArray(demands)) return [];

    demands.forEach(d => {
        // Apenas demandas finalizadas com vencedor
        if ((d.status === DemandStatus.CONCLUIDA || d.status === DemandStatus.VENCEDOR_DEFINIDO) && d.winner) {

            // Se o julgamento foi por ITENS
            if (d.winner.mode === 'item' && d.winner.items) {
                d.winner.items.forEach(wItem => {
                    const originalItem = d.items.find(i => i.id === (wItem.itemId || (wItem as any).item_id));
                    const isMatch = catalogItemId
                        ? originalItem?.catalog_item_id === catalogItemId
                        : originalItem?.description.toLowerCase() === description.toLowerCase();

                    if (isMatch) {
                        matches.push({
                            date: d.decisionDate || d.createdAt,
                            supplierName: wItem.supplierName,
                            unitPrice: wItem.unitPrice,
                            protocol: d.protocol
                        });
                    }
                });
            }
            // Se o julgamento foi GLOBAL
            else if (d.winner.supplierName) {
                const originalItem = d.items.find(i =>
                    catalogItemId
                        ? i.catalog_item_id === catalogItemId
                        : i.description.toLowerCase() === description.toLowerCase()
                );

                if (originalItem) {
                    // Buscar o preço unitário na proposta do vencedor
                    const winningProposal = d.proposals.find(p => p.supplierName === d.winner?.supplierName);
                    const pItem = winningProposal?.items.find(pi => (pi.itemId || (pi as any).item_id) === originalItem.id);

                    if (pItem) {
                        matches.push({
                            date: d.decisionDate || d.createdAt,
                            supplierName: d.winner!.supplierName!,
                            unitPrice: pItem.unitPrice,
                            protocol: d.protocol
                        });
                    }
                }
            }
        }
    });

    return matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
