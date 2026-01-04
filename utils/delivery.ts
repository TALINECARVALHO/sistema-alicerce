
/**
 * Utility to ensure delivery time strings contain calculated dates in parentheses.
 * Handles both "Conforme Edital" and "X dias (Antecipado)" formats.
 */
export const formatDeliveryTime = (deliveryTime: string | undefined, submittedAt: string | undefined, demandDeadline: string | undefined): string => {
    if (!deliveryTime) return '-';

    // 1. If it already has a date in the format (at least 8 chars like 01/01/20), return it.
    if (deliveryTime.includes('/') && deliveryTime.includes('(') && deliveryTime.includes(')')) {
        return deliveryTime;
    }

    // 2. Handle "Conforme Edital"
    if (deliveryTime.toLowerCase().includes('conforme edital')) {
        if (demandDeadline) {
            try {
                const date = new Date(demandDeadline);
                if (!isNaN(date.getTime())) {
                    const formatted = date.toLocaleDateString('pt-BR');
                    return `Conforme Edital (até ${formatted})`;
                }
            } catch (e) {
                // fallback to original
            }
        }
        return deliveryTime;
    }

    // 3. Handle "Antecipado" or just "X dias"
    const daysMatch = deliveryTime.match(/(\d+)\s*dias?/i);
    if (daysMatch && submittedAt) {
        try {
            const days = parseInt(daysMatch[1]);
            const submissionDate = new Date(submittedAt);
            if (!isNaN(submissionDate.getTime())) {
                const deliveryDate = new Date(submissionDate);
                deliveryDate.setDate(deliveryDate.getDate() + days);
                const formatted = deliveryDate.toLocaleDateString('pt-BR');

                // If it already has "(Antecipado)", just append the date inside or next to it
                if (deliveryTime.includes('(Antecipado)')) {
                    return deliveryTime.replace('(Antecipado)', `(Antecipado - ${formatted})`);
                }

                return `${deliveryTime} (até ${formatted})`;
            }
        } catch (e) {
            // fallback
        }
    }

    return deliveryTime;
};
