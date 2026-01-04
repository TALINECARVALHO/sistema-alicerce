import React, { useMemo, useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Demand, UserRole, Question, Proposal, DemandStatus, Group, Supplier, CatalogItem, Item, AuditLog, Priority } from '../types';
import { STATUS_COLORS, DEADLINE_RULES, addBusinessDays } from '../constants';
import QandA from './QandA';
import ProposalForm from './ProposalForm';
import ProposalAnalysis from './ProposalAnalysis';
import PrintOptionsModal from './PrintOptionsModal';
import StatCard from './StatCard';
import { BackIcon, FileIcon, DollarIcon, UsersIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, TrashIcon, PlusIcon, SparklesIcon, CogIcon, PrinterIcon, ArchiveIcon, ClockIcon, BellIcon, LockClosedIcon, ChartBarIcon, BanIcon, BuildingIcon, MailIcon, PhoneIcon, LocationMarkerIcon, FilterIcon, ShieldCheckIcon, BoxIcon, TagIcon, ChatIcon } from './icons';
import RejectionModal from './RejectionModal';
import Modal from './Modal';
import PriceHistoryPopover from './PriceHistoryPopover';
import ItemsDisplay from './ItemsDisplay';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as api from '../services/api';
import { addPDFHeader, addPDFFooter } from '../utils/reportUtils';

interface DemandDetailProps {
    demand: Demand;
    groups: Group[];
    suppliers: Supplier[];
    userRole: UserRole;
    currentSupplier?: Supplier;
    catalogItems?: CatalogItem[];
    allDemands: Demand[];
    onBack: () => void;
    onEdit?: () => void;
    onSubmitProposal: (demandId: number, proposal: Proposal) => Promise<void>;
    onAddQuestion: (demandId: number, question: Question) => void;
    onAnswerQuestion: (demandId: number, questionId: number, answer: string) => void;
    onDefineWinner: (demandId: number, winner: { supplierName: string; totalValue: number; justification?: string; }) => Promise<void>;
    onStatusChange: (demandId: number, newStatus: DemandStatus, reason?: string) => void;
    onRejectDemand: (demandId: number, reason: string) => void;
    onUpdateDemand?: (demandId: number, data: any) => Promise<void>;
    onNavigateToDemand?: (demandId: number) => void;
    onAlmoxarifadoDecision?: (demand_id: number, items: Item[], status: DemandStatus, observations?: string, rejectionReason?: string) => void;
    onComplete?: (demandId: number) => Promise<void>;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white p-6 rounded-xl shadow-md border border-slate-200/80 ${className}`}>
        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200/80 pb-4 mb-4">{title}</h3>
        <div className="space-y-2 text-sm text-slate-600">{children}</div>
    </div>
);

const GroupedItems: React.FC<{ items: Demand['items'], groups: Group[], winner?: Demand['winner'], proposals?: Demand['proposals'], isCitizen: boolean, demand: Demand, allDemands: Demand[], onNavigateToDemand?: (demandId: number) => void }> = ({ items, groups, winner, proposals, isCitizen, demand, allDemands, onNavigateToDemand }) => {
    const itemsByGroup = useMemo(() => {
        const grouped: { [key: string]: Demand['items'] } = {};
        for (const item of items) {
            if (!grouped[item.group_id]) grouped[item.group_id] = [];
            grouped[item.group_id].push(item);
        }
        return Object.entries(grouped);
    }, [items]);

    const itemPriceMap = useMemo(() => {
        const map = new Map<number, { unitPrice: number; deliveryTime: string }>();
        const hasWinner = !!winner;

        if (hasWinner) {
            if (winner.items && winner.items.length > 0) {
                winner.items.forEach((i: any) => {
                    const winningProposal = proposals?.find(p => p.supplierName === i.supplierName);
                    map.set(Number(i.itemId || i.item_id), {
                        unitPrice: i.unitPrice ?? i.unit_price ?? 0,
                        deliveryTime: winningProposal?.deliveryTime || winningProposal?.delivery_time || 'Conforme edital'
                    });
                });
            } else if (winner.supplierName) {
                const winningProposal = proposals?.find(p => p.supplierName === winner.supplierName);
                winningProposal?.items?.forEach((i: any) => {
                    map.set(Number(i.itemId || i.item_id), {
                        unitPrice: i.unitPrice ?? i.unit_price ?? 0,
                        deliveryTime: winningProposal.deliveryTime || winningProposal.delivery_time || 'Conforme edital'
                    });
                });
            }
        } else if (!isCitizen && proposals && proposals.length > 0 && demand.status !== DemandStatus.AGUARDANDO_PROPOSTA) {
            items.forEach(item => {
                let bestPrice = Infinity;
                let bestDeadline = '-';
                proposals.forEach(p => {
                    const pItem = p.items.find(pi => Number(pi.itemId || pi.item_id) === Number(item.id));
                    const unitPrice = pItem?.unitPrice ?? (pItem as any)?.unit_price ?? 0;
                    if (pItem && unitPrice > 0 && unitPrice < bestPrice) {
                        bestPrice = unitPrice;
                        bestDeadline = p.deliveryTime || (p as any).delivery_time || '-';
                    }
                });
                if (bestPrice !== Infinity) {
                    map.set(item.id, { unitPrice: bestPrice, deliveryTime: bestDeadline });
                }
            });
        }
        return map;
    }, [items, winner, proposals, isCitizen, demand.status]);

    return (
        <div className="space-y-6">
            {itemsByGroup.map(([groupId, groupItems]) => {
                const group = groups.find(g => g.id === groupId);
                return (
                    <div key={groupId} className="overflow-hidden rounded-xl border border-slate-200/80">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 border-b border-slate-200/80 flex items-center gap-2">
                            <BoxIcon className="w-3 h-3" /> Grupo: {group?.name || groupId}
                        </h4>
                        <ItemsDisplay
                            items={groupItems}
                            demand={demand}
                            allDemands={allDemands}
                            isCitizen={isCitizen}
                            hasWinner={!!winner}
                            itemPriceMap={itemPriceMap}
                            onNavigateToDemand={onNavigateToDemand}
                        />
                    </div>
                );
            })}
        </div>
    );
};

const DemandDetail: React.FC<DemandDetailProps> = ({
    demand,
    userRole,
    onBack,
    groups,
    suppliers,
    onRejectDemand,
    currentSupplier,
    catalogItems = [],
    onAlmoxarifadoDecision,
    onSubmitProposal,
    onAddQuestion,
    onAnswerQuestion,
    onDefineWinner,
    onStatusChange,
    onUpdateDemand,
    onNavigateToDemand,
    allDemands,
    onComplete,
    onEdit
}) => {
    const { success, error: toastError, warning } = useToast();
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);


    // Custom Modals
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [showCloseQuotationModal, setShowCloseQuotationModal] = useState(false);
    const [closingReason, setClosingReason] = useState('');
    const [showQandA, setShowQandA] = useState(false);
    const [showPrintOptions, setShowPrintOptions] = useState(false);

    // Edit State for Warehouse
    const [isEditingItems, setIsEditingItems] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [approvalObservations, setApprovalObservations] = useState('');
    const [editableItems, setEditableItems] = useState<Item[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    useEffect(() => {
        if (demand.items) {
            setEditableItems([...demand.items]);
            const groupsInDemand = Array.from(new Set(demand.items.map(i => i.group_id)));
            setSelectedGroupIds(groupsInDemand);
        }
    }, [demand.items, isEditingItems]);

    const availableGroupsForAdd = useMemo(() => {
        if (!groups || !catalogItems) return [];
        const itemTypeLabel = demand.type === 'Materiais' ? 'Material' : 'Serviço';
        const groupDescriptionPrefix = demand.type === 'Materiais' ? 'Materiais' : 'Serviços';

        const groupsWithType = groups.filter(g =>
            g.description.startsWith(groupDescriptionPrefix) ||
            catalogItems.some(item => item.groups.includes(g.id) && item.type === itemTypeLabel)
        );
        return groupsWithType.filter(g => g.isActive && !selectedGroupIds.includes(g.id));
    }, [groups, selectedGroupIds, demand.type, catalogItems]);

    // Determines if the phase is "Blind" (Secrecy required)
    const isBlindPhase = [DemandStatus.AGUARDANDO_PROPOSTA, DemandStatus.EM_ANALISE].includes(demand.status);

    const hasWinner = !!demand.winner;

    // Check for expired deadline
    const isDeadlineExpired = useMemo(() => {
        if (!demand.proposalDeadline) return false;
        return new Date(demand.proposalDeadline) < new Date();
    }, [demand.proposalDeadline]);

    const itemsForSupplier = useMemo(() => {
        if (userRole !== UserRole.FORNECEDOR || !currentSupplier || !groups) return demand.items;
        const supplierGroupIds = groups
            .filter(g => (currentSupplier.groups || []).includes(g.name))
            .map(g => g.id);
        return demand.items.filter(item => supplierGroupIds.includes(item.group_id));
    }, [demand.items, userRole, currentSupplier, groups]);

    // Determine if user is a citizen/transparency viewer
    const isCitizen = userRole === UserRole.CIDADAO;
    // Sensitive data (detailed stats, approval notes, list of proposals) is only shown to citizens if there is a winner/conclusion
    const showSensitiveData = !isCitizen || hasWinner;

    const lowestBid = useMemo(() => {
        if (demand.proposals.length === 0) return 0;
        const valid = demand.proposals.filter(p => !p.observations?.includes('DECLINED'));
        if (valid.length === 0) return 0;
        return Math.min(...valid.map(p => p.totalValue || 0));
    }, [demand.proposals]);

    const supplierProposal = useMemo(() => {
        if (userRole !== UserRole.FORNECEDOR || !currentSupplier) return null;
        return demand.proposals.find(p => {
            const pSupplierId = p.supplierId || (p as any).supplier_id;
            const pSupplierName = p.supplierName || (p as any).supplier_name;
            return String(pSupplierName) === String(currentSupplier.name) || Number(pSupplierId) === Number(currentSupplier.id);
        });
    }, [demand.proposals, userRole, currentSupplier]);

    const statusColor = STATUS_COLORS[demand.status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

    // --- FIND WINNING SUPPLIER FULL DETAILS ---
    const winningSupplierFullDetails = useMemo(() => {
        if (!demand.winner || !suppliers) return null;

        // Find proposal to get more accurate supplier ID if possible
        const winningProposal = demand.proposals.find(p => p.supplierName === demand.winner?.supplierName);

        if (winningProposal) {
            const pId = winningProposal.supplierId || (winningProposal as any).supplier_id;
            const supplier = suppliers.find(s => s.id === pId);
            if (supplier) return supplier;
        }

        // Fallback to name search
        return suppliers.find(s => s.name === demand.winner?.supplierName);
    }, [demand.winner, demand.proposals, suppliers]);

    const handleConfirmRejection = (reason: string) => {
        onRejectDemand(demand.id, reason);
        setIsRejectionModalOpen(false);
    };

    const handleDeclineClick = () => {
        if (!currentSupplier || !currentSupplier.id) {
            toastError("Erro: Não foi possível identificar o perfil da sua empresa. Recarregue a página.");
            return;
        }
        setShowDeclineModal(true);
    };

    const confirmDecline = async () => {
        setShowDeclineModal(false);
        setIsDeclining(true);

        try {
            if (!currentSupplier || !currentSupplier.id) throw new Error("Fornecedor não identificado.");

            const declinedProposal: Proposal = {
                id: Date.now(),
                protocol: `DEC-${String(Date.now()).slice(-4)}`,
                supplierId: currentSupplier.id,
                supplierName: currentSupplier.name,
                deliveryTime: "N/A",
                items: (demand.items || []).map(i => ({ itemId: i.id, unitPrice: 0, brand: 'N/A' })),
                submittedAt: new Date().toISOString(),
                totalValue: 0,
                observations: "DECLINED_BY_SUPPLIER"
            };

            await onSubmitProposal(demand.id, declinedProposal);
            success("Oportunidade declinada com sucesso.");
            if (onBack) onBack();
        } catch (e: any) {
            toastError(`Falha ao registrar o declínio.`);
        } finally {
            setIsDeclining(false);
        }
    }

    const handleConfirmClosing = () => {
        if (!closingReason.trim()) {
            warning("É obrigatório informar uma justificativa para o encerramento.");
            return;
        }
        const finalReason = isDeadlineExpired
            ? `Encerramento por Prazo: ${closingReason}`
            : `Encerramento Antecipado: ${closingReason}`;
        onStatusChange(demand.id, DemandStatus.EM_ANALISE, finalReason);
        setShowCloseQuotationModal(false);
        setClosingReason('');
    };

    const handleAlmoxarifadoApprove = () => {
        setIsApproving(true);
    };

    const confirmApproval = async () => {
        try {
            let updateData: any = {
                status: DemandStatus.AGUARDANDO_PROPOSTA,
                approval_observations: approvalObservations || undefined
            };

            // Calculate deadlines if they are not set
            if (!demand.proposalDeadline || !demand.deadline) {
                // Safety normalization for legacy data
                const typeKey = (demand.type === 'Material' ? 'Materiais' : demand.type === 'Serviço' ? 'Serviços' : demand.type) as keyof typeof DEADLINE_RULES;
                const rules = DEADLINE_RULES[typeKey]?.[demand.priority];

                if (rules) {
                    const now = new Date();
                    const propDate = addBusinessDays(now, rules.proposalDays);
                    const delDate = addBusinessDays(propDate, rules.deliveryDays);

                    updateData.proposalDeadline = new Date(propDate.toISOString().split('T')[0] + 'T23:59:59').toISOString();
                    updateData.deadline = new Date(delDate.toISOString().split('T')[0] + 'T23:59:59').toISOString();
                }
            }

            if (onUpdateDemand) {
                await onUpdateDemand(demand.id, updateData);
            } else {
                onStatusChange(demand.id, DemandStatus.AGUARDANDO_PROPOSTA, approvalObservations || undefined);
            }
            setIsApproving(false);
        } catch (e: any) {
            toastError("Falha ao aprovar demanda: " + e.message);
        }
    };

    const handleSaveAdjustments = async () => {
        if (onUpdateDemand) {
            await onUpdateDemand(demand.id, { items: editableItems });
            setIsEditingItems(false);
        }
    };

    const handleAddItem = (catalogItem: CatalogItem, group_id: string) => {
        const newItem: Item = {
            id: Date.now(),
            description: catalogItem.name,
            unit: catalogItem.unit,
            quantity: 1,
            group_id,
            catalog_item_id: catalogItem.id
        };
        setEditableItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (itemId: number) => {
        setEditableItems(prev => prev.filter(i => i.id !== itemId));
    };

    const handleUpdateQuantity = (itemId: number, qty: number) => {
        setEditableItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, qty) } : i));
    };

    const handleAddGroup = (groupId: string) => {
        if (!selectedGroupIds.includes(groupId)) {
            setSelectedGroupIds(prev => [...prev, groupId]);
        }
    };

    const handleRemoveGroup = (groupId: string) => {
        setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
        setEditableItems(prev => prev.filter(i => i.group_id !== groupId));
    };

    const handlePrintClick = () => {
        setShowPrintOptions(true);
    };

    const handleExportPDF = (options: any) => {
        setIsExporting(true);
        setShowPrintOptions(false);
        const doc = new jsPDF();

        // Header & Footer
        addPDFHeader(doc, 'Relatório de Demanda');

        let yPos = 45;

        doc.setTextColor('#000000');
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text(`Protocolo: ${demand.protocol}`, 14, yPos); yPos += 8;
        doc.text(`Título: ${demand.title}`, 14, yPos); yPos += 6;
        doc.text(`Status: ${demand.status}`, 14, yPos); yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        if (options.includeRequester && demand.deliveryLocation) {
            doc.text(`Local de Entrega: ${demand.deliveryLocation}`, 14, yPos); yPos += 10;
        } else {
            yPos += 4;
        }

        // --- WINNER DETAILS (If available and selected) ---
        if (options.includeWinner && demand.winner && demand.status === DemandStatus.VENCEDOR_DEFINIDO) {
            doc.setFillColor('#ecfdf5'); // emerald-50
            doc.rect(14, yPos, 182, 10, 'F');
            doc.setTextColor('#064e3b'); // emerald-900
            doc.setFontSize(12); doc.setFont('helvetica', 'bold');
            doc.text("RESULTADO DA HOMOLOGAÇÃO (DADOS PARA EMPENHO)", 16, yPos + 7);
            yPos += 14;

            doc.setTextColor('#000000'); doc.setFontSize(10); doc.setFont('helvetica', 'normal');

            // Resolve Winner Details (Bank, etc)
            let winnerDetailsText = "";
            let winnersToPrint: any[] = []; // { name, total, items? }

            // Fallback for legacy records: check items existence first for 'item' mode, otherwise global
            const effectiveMode = demand.winner.mode || (demand.winner.items && demand.winner.items.length > 0 ? 'item' : 'global');

            if (effectiveMode === 'global') {
                const winnerName = demand.winner.supplierName || 'Fornecedor não identificado';
                // Try to find supplier by proposal ID first (more robust)
                const winningProposal = demand.proposals.find(p => p.supplierName === winnerName);
                let sup = suppliers.find(s => s.id === winningProposal?.supplierId);
                if (!sup) sup = suppliers.find(s => s.name === winnerName);

                winnersToPrint.push({ name: winnerName, total: demand.winner.totalValue, supplier: sup, proposal: winningProposal });
            } else if (effectiveMode === 'item' && demand.winner.items) {
                const distinctWinners = Array.from(new Set(demand.winner.items.map((i: any) => i.supplierName)));
                distinctWinners.forEach((wName: string) => {
                    const wItems = demand.winner?.items?.filter((i: any) => i.supplierName === wName);
                    const wTotal = wItems?.reduce((acc: number, curr: any) => acc + curr.totalValue, 0) || 0;

                    // Robust Lookup
                    const wProposal = demand.proposals.find(p => p.supplierName === wName);
                    let sup = suppliers.find(s => s.id === wProposal?.supplierId);
                    if (!sup) sup = suppliers.find(s => s.name === wName);

                    winnersToPrint.push({ name: wName, total: wTotal, supplier: sup, items: wItems, proposal: wProposal });
                });
            }

            winnersToPrint.forEach(w => {
                // --- WINNER CARD ---
                const cardStartY = yPos;
                // Card Border (Placeholder for height calc)

                // 1. Supplier Name Header
                doc.setFillColor('#e2e8f0'); // slate-200
                doc.rect(14, yPos, 182, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor('#1e293b'); // slate-800
                doc.text(w.name.toUpperCase(), 16, yPos + 5.5);

                // Total Value Highlight (Right aligned in header)
                doc.setTextColor('#059669'); // emerald-600
                doc.text(`TOTAL: ${w.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 194, yPos + 5.5, { align: 'right' });

                yPos += 14;

                // 2. Info Grid
                doc.setTextColor('#334155'); // slate-700
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');

                // Row 1: Labels
                doc.text('CNPJ:', 16, yPos);
                doc.text('Telefone:', 70, yPos);
                doc.text('Email:', 120, yPos);
                yPos += 4;

                // Row 1: Values
                doc.setFont('helvetica', 'normal');
                if (w.supplier) {
                    doc.text(w.supplier.cnpj || '-', 16, yPos);
                    doc.text(w.supplier.phone || '-', 70, yPos);
                    doc.text(w.supplier.email || '-', 120, yPos);
                } else {
                    doc.text('-', 16, yPos);
                }

                yPos += 8;

                // Row 2: Address
                doc.setFont('helvetica', 'bold');
                doc.text('Endereço Completo:', 16, yPos);
                yPos += 4;
                doc.setFont('helvetica', 'normal');
                doc.text(w.supplier?.address || 'Endereço não informado', 16, yPos);
                yPos += 8;

                // Row 3: Bank + Delivery
                doc.setDrawColor('#cbd5e1'); // slate-300
                doc.line(16, yPos - 2, 194, yPos - 2); // Separator line
                yPos += 4;

                doc.setFont('helvetica', 'bold');
                doc.text('Dados Bancários:', 16, yPos);
                doc.text('Prazo de Entrega:', 120, yPos);
                yPos += 4;

                doc.setFont('helvetica', 'normal');
                if (w.supplier?.bankName) {
                    doc.text(`${w.supplier.bankName} | Ag: ${w.supplier.agency} | CC: ${w.supplier.accountNumber}`, 16, yPos);
                    if (w.supplier.pixKey) {
                        yPos += 4;
                        doc.text(`Chave PIX: ${w.supplier.pixKey}`, 16, yPos);
                    }
                } else {
                    doc.text('Não informado.', 16, yPos);
                }

                // Proposal Details (Right side)
                const winProposal = w.proposal || demand.proposals.find(p => p.supplierName === w.name);
                if (winProposal?.deliveryTime) {
                    doc.text(winProposal.deliveryTime, 120, w.supplier?.pixKey ? yPos - 4 : yPos);
                } else {
                    doc.text('Conforme edital', 120, w.supplier?.pixKey ? yPos - 4 : yPos);
                }

                yPos += 8;

                // Draw Card Border
                doc.setDrawColor('#94a3b8'); // slate-400
                doc.rect(14, cardStartY, 182, yPos - cardStartY);
                yPos += 5;

                // 3. Items Table
                if (w.items) {
                    const itemBody = w.items.map((wi: any) => {
                        const originalItem = demand.items.find(i => i.id === (wi.itemId || wi.item_id));
                        return [originalItem?.description || 'Item', wi.quantity, `R$ ${wi.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `R$ ${wi.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`];
                    });
                    autoTable(doc, {
                        startY: yPos,
                        head: [['Item Adjudicado', 'Qtd', 'Unitário', 'Total']],
                        body: itemBody,
                        theme: 'grid',
                        headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.1 },
                        styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.1 },
                        columnStyles: {
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 20, halign: 'center' },
                            2: { cellWidth: 30, halign: 'right' },
                            3: { cellWidth: 30, halign: 'right' }
                        },
                        margin: { left: 14, right: 14 }
                    });
                    yPos = (doc as any).lastAutoTable.finalY + 10;
                } else {
                    yPos += 5;
                }
            });
        }

        if (options.includeItems) {
            doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            doc.text("RELAÇÃO GERAL DE ITENS DO PROCESSO (COM VALORES HOMOLOGADOS)", 14, yPos);
            yPos += 2;

            // Build Price Map for Items
            const itemPriceMap = new Map<number, number>();
            try {
                if (demand.winner?.items && demand.winner.items.length > 0) {
                    // Item Mode
                    demand.winner.items.forEach((i: any) => itemPriceMap.set(Number(i.itemId || i.item_id), i.unitPrice));
                } else {
                    // Global Mode - Try to find proposal by Name OR by Total Value (Heuristic for legacy)
                    let winProp = demand.proposals.find(p => p.supplierName === demand.winner?.supplierName);

                    if (!winProp && demand.winner?.totalValue) {
                        // Fallback: Find by matching total value
                        winProp = demand.proposals.find(p => Math.abs((p.totalValue || 0) - demand.winner!.totalValue) < 0.01);
                    }

                    if (winProp && winProp.items) {
                        winProp.items.forEach((i: any) => itemPriceMap.set(Number(i.itemId || i.item_id), i.unitPrice));
                    }
                }
            } catch (e) { console.error('Error mapping prices', e); }

            const tableBody = demand.items.map(item => {
                const unitPrice = itemPriceMap.get(item.id) || 0;
                const totalItem = unitPrice * item.quantity;
                return [
                    item.description,
                    item.quantity,
                    item.unit,
                    unitPrice > 0 ? unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-',
                    unitPrice > 0 ? totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
                ];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Descrição', 'Qtd', 'Unid.', 'Valor Unit.', 'Valor Total']],
                body: tableBody,
                headStyles: { fillColor: [22, 53, 92] }, // Corporate Blue
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    3: { cellWidth: 30, halign: 'right' },
                    4: { cellWidth: 30, halign: 'right' }
                }
            });

            // Description (If selected)
            if (options.includeDescription && demand.requestDescription) {
                yPos = (doc as any).lastAutoTable.finalY + 10;
                if (yPos > 250) { doc.addPage(); yPos = 40; addPDFHeader(doc, 'Relatório de Demanda'); } // Page break check

                doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
                doc.text("DESCRIÇÃO DA NECESSIDADE", 14, yPos); yPos += 5;
                doc.setFont('helvetica', 'normal'); doc.setFontSize(10);

                const splitDesc = doc.splitTextToSize(demand.requestDescription, 180);
                doc.text(splitDesc, 14, yPos);
                yPos += splitDesc.length * 5;
            }
        } else if (options.includeDescription && demand.requestDescription) {
            // Only Description (No Items)
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
            doc.text("DESCRIÇÃO DA NECESSIDADE", 14, yPos); yPos += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            const splitDesc = doc.splitTextToSize(demand.requestDescription, 180);
            doc.text(splitDesc, 14, yPos);
            yPos += splitDesc.length * 5;
        }

        // Add Footer on all pages
        addPDFFooter(doc);

        doc.save(`relatorio-oficial-${demand.protocol}.pdf`);
        setIsExporting(false);
    };



    const canAnalyzeProposals = [UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO].includes(userRole);
    const isRequesterOrManager = [UserRole.SECRETARIA, UserRole.CONTRATACOES, UserRole.ALMOXARIFADO, UserRole.GESTOR_SUPREMO].includes(userRole);
    const isWarehouseUser = [UserRole.ALMOXARIFADO, UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO].includes(userRole);

    return (
        <div id="demand-detail-container" className="space-y-8 bg-white p-6 lg:p-10 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between hide-on-print-wrapper">
                <button onClick={onBack} className="hide-on-print flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"><BackIcon /><span>Voltar para a lista</span></button>
                <div className="flex items-center gap-3">
                    {onEdit && demand.status === DemandStatus.RASCUNHO && (
                        <button
                            onClick={onEdit}
                            className="hide-on-print flex items-center space-x-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors text-sm font-bold border border-amber-200 shadow-sm"
                        >
                            <SparklesIcon className="w-4 h-4" /> <span>Retomar Rascunho</span>
                        </button>
                    )}
                    <button
                        onClick={handlePrintClick}
                        disabled={isExporting}
                        className="hide-on-print flex items-center space-x-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                        {isExporting ? <span className="animate-pulse">Gerando...</span> : <><PrinterIcon className="w-4 h-4" /> <span>Imprimir</span></>}
                    </button>

                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>{demand.status}</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                    <span className="bg-blue-50 px-2 py-1 rounded-md">{demand.protocol}</span>
                    {demand.group && <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-md"><TagIcon className="w-3 h-3" /> {demand.group}</span>}
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">{demand.title}</h2>
            </div>

            {/* Stat Cards Grid - or Compact Row for Suppliers */}
            {userRole === UserRole.FORNECEDOR && demand.status === DemandStatus.AGUARDANDO_PROPOSTA && !supplierProposal ? (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 mb-6">
                        {/* Fim da Cotação */}
                        <div className="flex-1 p-6 flex items-center gap-5">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <CalendarIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Fim da Cotação</p>
                                <p className="text-2xl font-extrabold text-slate-800">
                                    {demand.proposalDeadline ? new Date(demand.proposalDeadline).toLocaleDateString('pt-BR') : 'A definir'}
                                </p>
                                <p className="text-sm text-slate-500 font-medium">Prazo para envio da proposta</p>
                            </div>
                        </div>

                        {/* Prazo de Entrega */}
                        <div className="flex-1 p-6 flex items-center gap-5">
                            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                <ClockIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Prazo de Entrega</p>
                                <p className="text-2xl font-extrabold text-slate-800">
                                    {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR') : 'A definir'}
                                </p>
                                <p className="text-sm text-slate-500 font-medium">Data limite de execução</p>
                            </div>
                        </div>

                        {/* Local de Entrega (Merged) */}
                        <div className="flex-1 p-6 flex items-center gap-5">
                            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                                <LocationMarkerIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Local de Entrega</p>
                                <p className="text-lg font-bold text-slate-800 leading-tight">
                                    {demand.deliveryLocation || 'Não especificado'}
                                </p>
                                <p className="text-sm text-slate-500 font-medium">{demand.requestingDepartment}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons for Supplier */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowQandA(!showQandA)}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-colors uppercase text-xs tracking-wider"
                        >
                            <ChatIcon className="w-5 h-5" />
                            {showQandA ? 'Ocultar Dúvidas' : 'Tirar Dúvidas'}
                        </button>
                        <button
                            onClick={handleDeclineClick}
                            disabled={isDeclining}
                            className="flex-1 py-3 bg-white hover:bg-red-50 text-red-500 font-bold rounded-xl border border-red-200 flex items-center justify-center gap-2 transition-colors uppercase text-xs tracking-wider"
                        >
                            <XCircleIcon className="w-5 h-5" />
                            Declinar Interesse
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
                    {/* Standard View */}
                    {/* 1. Interaction: Questions */}
                    <StatCard
                        icon={<ChatIcon />}
                        title="Dúvidas"
                        value={demand.questions?.length || 0}
                        subtitle="Perguntas Enviadas"
                        valueClassName="text-sm sm:text-base lg:text-lg"
                    />

                    {/* 2. Financials: Value */}
                    <StatCard
                        icon={<DollarIcon />}
                        title={demand.status === DemandStatus.VENCEDOR_DEFINIDO ? "Valor Homologado" : "Melhor Oferta"}
                        value={
                            demand.status === DemandStatus.VENCEDOR_DEFINIDO && (demand.winner?.totalValue ?? demand.winner?.total_value)
                                ? (demand.winner.totalValue ?? demand.winner?.total_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : !isBlindPhase && lowestBid > 0
                                    ? lowestBid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                    : '---'
                        }
                        subtitle={
                            demand.status === DemandStatus.VENCEDOR_DEFINIDO
                                ? (demand.winner?.mode === 'item' ? "Misto (por Item)" : "Menor Preço Global")
                                : (isBlindPhase ? "Em disputa" : undefined)
                        }
                        valueClassName="text-sm sm:text-base lg:text-lg text-emerald-600"
                    />

                    {/* 3. Timeline: Deadlines */}
                    <StatCard
                        icon={<CalendarIcon />}
                        title={demand.status === DemandStatus.VENCEDOR_DEFINIDO ? "Previsão de Entrega" : "Fim Cotação"}
                        value={
                            demand.status === DemandStatus.VENCEDOR_DEFINIDO && demand.deadline
                                ? new Date(demand.deadline).toLocaleDateString('pt-BR')
                                : demand.proposalDeadline
                                    ? new Date(demand.proposalDeadline).toLocaleDateString('pt-BR')
                                    : 'A definir'
                        }
                        valueClassName="text-sm sm:text-base lg:text-lg"
                    />

                    {/* 4. Engagement: Proposals */}
                    <StatCard
                        icon={<UsersIcon />}
                        title="Propostas Recebidas"
                        value={demand.proposals.length}
                        subtitle={demand.proposals.length === 1 ? 'Proposta Recebida' : 'Propostas Recebidas'}
                        valueClassName="text-sm sm:text-base lg:text-lg"
                    />
                </div>
            )}

            {/* Manager Actions Panel (End of Quotation) */}
            {
                canAnalyzeProposals && demand.status === DemandStatus.AGUARDANDO_PROPOSTA && (
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mt-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-slate-500" />
                                {isDeadlineExpired ? 'Prazo de Cotação Expirado' : 'Período de Cotação em Andamento'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {demand.proposals.length} propostas recebidas.
                                {isDeadlineExpired
                                    ? "O prazo encerrou. Você deve iniciar a análise técnica para escolher o vencedor."
                                    : "Ainda há tempo hábil, mas você pode encerrar antecipadamente se desejar."}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCloseQuotationModal(true)}
                            className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all ${isDeadlineExpired ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                        >
                            {isDeadlineExpired ? 'Encerrar e Analisar' : 'Forçar Encerramento'}
                        </button>
                    </div>
                )
            }

            {/* Warehouse Analysis Decision Panel */}
            {
                isWarehouseUser && demand.status === DemandStatus.AGUARDANDO_ANALISE_ALMOXARIFADO && (
                    <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl animate-fade-in-down border border-indigo-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldCheckIcon className="w-40 h-40" /></div>
                        <div className="relative z-10">
                            {!isApproving ? (
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Análise Técnica Requerida</h3>
                                        <p className="text-indigo-200 text-sm max-w-xl">Valide se as descrições dos itens, quantidades e prazos estão corretos antes de liberar para os fornecedores. Uma vez aprovada, a demanda ficará visível para o mercado.</p>
                                    </div>
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <button onClick={() => setIsRejectionModalOpen(true)} className="flex-1 md:flex-initial px-6 py-3 bg-white/10 hover:bg-red-500 transition-colors border border-white/20 rounded-xl font-bold uppercase text-xs tracking-widest">Reprovar Pedido</button>
                                        <button onClick={() => setIsEditingItems(!isEditingItems)} className="flex-1 md:flex-initial px-6 py-3 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-xl font-bold uppercase text-xs tracking-widest">{isEditingItems ? 'Cancelar Ajustes' : 'Ajustar Itens'}</button>
                                        {!isEditingItems && <button onClick={handleAlmoxarifadoApprove} className="flex-1 md:flex-initial px-10 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-950/50 transform active:scale-95 transition-all">Aprovar e Publicar</button>}
                                        {isEditingItems && <button onClick={handleSaveAdjustments} className="flex-1 md:flex-initial px-10 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-950/50 transform active:scale-95 transition-all">Salvar Alterações</button>}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Observações para Fornecedores</h3>
                                        <p className="text-indigo-200 text-sm mb-4">Adicione notas técnicas, exigências específicas de marcas ou condições de entrega que os fornecedores devem saber.</p>
                                        <textarea
                                            value={approvalObservations}
                                            onChange={(e) => setApprovalObservations(e.target.value)}
                                            placeholder="Ex: Exigimos marcas de primeira linha para os itens de construção. Entrega em horário comercial..."
                                            className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:bg-white/15 outline-none transition-all min-h-[120px]"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-4">
                                        <button onClick={() => setIsApproving(false)} className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-xl font-bold uppercase text-xs tracking-widest">Voltar</button>
                                        <button onClick={confirmApproval} className="px-10 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-950/50 transform active:scale-95 transition-all flex items-center gap-2">
                                            <ShieldCheckIcon className="w-5 h-5" />
                                            Confirmar e Publicar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Winner Details Section */}
            {
                hasWinner && (isRequesterOrManager || isCitizen) && (
                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl shadow-sm animate-fade-in-down">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-emerald-200/60">
                            <div className="bg-emerald-100 p-3 rounded-full text-emerald-700"><BuildingIcon className="w-6 h-6" /></div>
                            <div><h3 className="text-xl font-bold text-emerald-900">Resultado da Homologação</h3><p className="text-sm text-emerald-700">Dados oficiais para empenho e contratação</p></div>
                        </div>

                        {demand.winner?.mode === 'item' ? (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg border border-emerald-100 overflow-hidden">
                                    <table className="min-w-full divide-y divide-emerald-100">
                                        <thead className="bg-emerald-100/50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-bold text-emerald-800 uppercase">Item</th>
                                                <th className="px-4 py-2 text-left text-xs font-bold text-emerald-800 uppercase">Vencedor</th>
                                                <th className="px-4 py-2 text-left text-xs font-bold text-emerald-800 uppercase">CNPJ</th>
                                                <th className="px-4 py-2 text-right text-xs font-bold text-emerald-800 uppercase">Valor Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-50">
                                            {demand.winner.items?.map((winItem: any, idx: number) => {
                                                const originalItem = demand.items.find(i => i.id === (winItem.itemId || winItem.item_id));
                                                const sup = suppliers.find(s => s.name === winItem.supplierName);
                                                return (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 text-sm text-slate-700">{originalItem?.description || `Item ${idx + 1}`}</td>
                                                        <td className="px-4 py-2 text-sm font-bold text-emerald-700">{winItem.supplierName}</td>
                                                        <td className="px-4 py-2 text-sm text-slate-500 font-mono">{sup?.cnpj || '-'}</td>
                                                        <td className="px-4 py-2 text-right text-sm font-bold text-slate-800">{winItem.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-emerald-50">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-2 text-right text-xs font-bold text-emerald-800 uppercase">Valor Total Global Adjudicado:</td>
                                                <td className="px-4 py-2 text-right text-sm font-black text-emerald-900">
                                                    {(demand.winner.items?.reduce((acc: number, cur: any) => acc + cur.totalValue, 0) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                                <div><p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Razão Social</p><p className="font-bold text-slate-800">{demand.winner?.supplierName}</p></div>
                                <div><p className="text-[10px] font-black uppercase text-emerald-600 mb-1">CNPJ</p><p className="font-bold text-slate-800">{winningSupplierFullDetails?.cnpj || demand.winner?.cnpj || '-'}</p></div>
                                <div><p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Valor Homologado</p><p className="font-bold text-slate-800">{(demand.winner?.totalValue ?? demand.winner?.total_value)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                                {winningSupplierFullDetails && isRequesterOrManager && (
                                    <>
                                        <div><p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Responsável</p><p className="font-bold text-slate-800">{winningSupplierFullDetails.contactPerson}</p></div>
                                        <div><p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Contatos</p><p className="font-medium text-slate-700">{winningSupplierFullDetails.phone} | {winningSupplierFullDetails.email}</p></div>
                                    </>
                                )}
                            </div>
                        )}

                        {demand.winner?.justification && (
                            <div className="mt-4 pt-4 border-t border-emerald-200/60">
                                <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Justificativa da Homologação</p>
                                <p className="text-sm text-emerald-900 italic bg-white/50 p-3 rounded-lg border border-emerald-100">"{demand.winner.justification}"</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Main Content Grid */}
            {
                !(userRole === UserRole.FORNECEDOR && demand.status === DemandStatus.AGUARDANDO_PROPOSTA && !supplierProposal && !demand.rejectionReason) && (
                    <div className="space-y-6">
                        {/* Requester Data - Now at the top */}
                        {userRole !== UserRole.FORNECEDOR && (
                            <InfoCard title="Dados do Solicitante">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                                            <BuildingIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400">Secretaria</p>
                                            <p className="font-bold text-slate-800">{demand.requestingDepartment}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                                            <LocationMarkerIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400">Local de Entrega</p>
                                            <p className="font-bold text-slate-800">{demand.deliveryLocation}</p>
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>
                        )}

                        {/* Description of Necessity */}
                        {userRole !== UserRole.FORNECEDOR && demand.requestDescription && (
                            <InfoCard title="Descrição da Necessidade">
                                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{demand.requestDescription}</p>
                            </InfoCard>
                        )}

                        {/* Items List */}
                        {!(userRole === UserRole.FORNECEDOR && demand.status === DemandStatus.AGUARDANDO_PROPOSTA && !supplierProposal) && (
                            <InfoCard title="Itens da Demanda">
                                {isEditingItems ? (
                                    <div className="space-y-8 animate-fade-in-down">
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-blue-900 font-bold flex items-center gap-2"><PlusIcon className="w-5 h-5" /> Adicionar Novos Itens</h4>
                                                <p className="text-blue-700 text-xs">Selecione um grupo para adicionar itens do catálogo.</p>
                                            </div>
                                            <select
                                                onChange={e => handleAddGroup(e.target.value)}
                                                value=""
                                                className="w-full md:w-64 rounded-xl border-blue-200 bg-white text-sm py-2 px-3 shadow-sm focus:ring-blue-500"
                                            >
                                                <option value="" disabled>Selecionar Grupo...</option>
                                                {availableGroupsForAdd.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-6">
                                            {selectedGroupIds.map(groupId => {
                                                const group = groups.find(g => g.id === groupId);
                                                const groupItems = editableItems.filter(i => i.group_id === groupId);
                                                const groupCatalogItems = catalogItems.filter(ci => ci.groups.includes(groupId) && ci.type === (demand.type === 'Materiais' ? 'Material' : 'Serviço'));
                                                const addedItemIds = groupItems.map(i => i.catalog_item_id);
                                                const availableCatalogItems = groupCatalogItems.filter(ci => !addedItemIds.includes(ci.id));

                                                return (
                                                    <div key={groupId} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                                        <div className="bg-white px-5 py-3 flex justify-between items-center border-b border-slate-200">
                                                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><div className="w-1.5 h-5 bg-indigo-600 rounded-full"></div> {group?.name || groupId}</h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveGroup(groupId)}
                                                                className="text-red-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="p-5 space-y-4">
                                                            {groupItems.map((item, idx) => (
                                                                <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                    <div className="flex-grow text-sm font-bold text-slate-700">{item.description} <span className="text-xs font-normal text-slate-400">({item.unit})</span></div>
                                                                    <div className="w-full sm:w-32 flex items-center gap-2">
                                                                        <label className="text-[10px] text-slate-400 uppercase font-black">Qtd:</label>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={item.quantity}
                                                                            onChange={e => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                                                                            className="w-full rounded-lg border-slate-200 px-2 py-1 text-center font-bold text-slate-800 focus:ring-indigo-500 focus:border-indigo-500"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveItem(item.id)}
                                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <XCircleIcon className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            <div className="pt-2">
                                                                <select
                                                                    value=""
                                                                    onChange={e => {
                                                                        const ci = availableCatalogItems.find(i => i.id === e.target.value);
                                                                        if (ci) handleAddItem(ci, groupId);
                                                                    }}
                                                                    className="w-full rounded-xl border-dashed border-2 border-slate-300 text-slate-500 text-sm py-2.5 px-3 focus:border-indigo-400 bg-white/50 hover:bg-white transition-colors cursor-pointer"
                                                                >
                                                                    <option value="" disabled>+ Adicionar item do catálogo...</option>
                                                                    {availableCatalogItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                        <GroupedItems
                                            items={itemsForSupplier}
                                            groups={groups}
                                            winner={demand.winner}
                                            proposals={demand.proposals}
                                            isCitizen={isCitizen}
                                            demand={demand}
                                            allDemands={allDemands}
                                            onNavigateToDemand={onNavigateToDemand}
                                        />
                                    </div>)}
                            </InfoCard>
                        )}

                        {/* Rejection Reason */}
                        {demand.rejectionReason && (
                            <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-800">
                                <h4 className="font-black text-xs uppercase mb-2">Motivo da Reprovação</h4>
                                <p className="text-sm italic">"{demand.rejectionReason}"</p>
                            </div>
                        )}
                    </div>
                )
            }

            {
                userRole === UserRole.FORNECEDOR && demand.status === DemandStatus.AGUARDANDO_PROPOSTA && (
                    <div className="pt-2">
                        {supplierProposal ? (
                            supplierProposal.observations?.includes('DECLINED_BY_SUPPLIER') ? (
                                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-8 flex items-center justify-between shadow-inner">
                                    <div><h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Oportunidade Declinada</h3><p className="text-slate-500 font-medium">Você informou que não participará desta cotação.</p></div>
                                    <button onClick={onBack} className="bg-white border border-slate-300 px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Voltar</button>
                                </div>
                            ) : (
                                <div className="bg-emerald-600 text-white rounded-2xl p-8 flex items-center justify-between shadow-xl animate-fade-in-down">
                                    <div><h3 className="text-2xl font-black uppercase tracking-tight">Proposta Registrada!</h3><p className="text-emerald-100">Seu protocolo é <b>{supplierProposal.protocol}</b>. O resultado será publicado após o prazo.</p></div>
                                    <button onClick={onBack} className="bg-white text-emerald-700 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-50 transition-all shadow-lg">Voltar ao Painel</button>
                                </div>
                            )
                        ) : (
                            <div className="space-y-10">
                                <ProposalForm demand={demand} onSubmit={onSubmitProposal} currentSupplier={currentSupplier} groups={groups} />
                            </div>
                        )}
                    </div>
                )
            }

            {canAnalyzeProposals && demand.status === DemandStatus.EM_ANALISE && <ProposalAnalysis demand={demand} allDemands={allDemands} onDefineWinner={onDefineWinner} onNavigateToDemand={onNavigateToDemand} />}

            {(showQandA || (userRole !== UserRole.FORNECEDOR)) && (
                <div className="space-y-6">
                    <QandA
                        demand={demand}
                        userRole={userRole}
                        onAddQuestion={onAddQuestion}
                        onAnswerQuestion={onAnswerQuestion}
                        currentSupplier={currentSupplier}
                        disableNewQuestions={!!supplierProposal}
                        onSuccess={onBack}
                    />
                </div>
            )}

            <RejectionModal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} onConfirm={handleConfirmRejection} />

            {
                showDeclineModal && (
                    <Modal isOpen={true} onClose={() => setShowDeclineModal(false)} title="Confirmar Declínio">
                        <div className="space-y-6">
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">Ao declinar, esta oportunidade deixará de aparecer no seu painel de ações pendentes.</div>
                            <div className="flex justify-end gap-3"><button onClick={() => setShowDeclineModal(false)} className="px-6 py-3 font-bold text-slate-500">Voltar</button><button onClick={confirmDecline} className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Confirmar Declínio</button></div>
                        </div>
                    </Modal>
                )
            }

            {
                showCloseQuotationModal && (
                    <Modal isOpen={true} onClose={() => setShowCloseQuotationModal(false)} title="Encerrar Cotação">
                        <div className="space-y-6">
                            <textarea value={closingReason} onChange={e => setClosingReason(e.target.value)} className="w-full border border-slate-200 rounded-2xl p-5 shadow-inner min-h-[150px]" placeholder="Justifique por que o processo está sendo encerrado agora..."></textarea>
                            <div className="flex justify-end gap-3"><button onClick={() => setShowCloseQuotationModal(false)} className="px-6 py-3 font-bold">Cancelar</button><button onClick={handleConfirmClosing} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Confirmar e Analisar</button></div>
                        </div>
                    </Modal>
                )
            }


            <PrintOptionsModal
                isOpen={showPrintOptions}
                onClose={() => setShowPrintOptions(false)}
                onConfirm={handleExportPDF}
                hasWinner={!!demand.winner && demand.status === DemandStatus.VENCEDOR_DEFINIDO}
            />
        </div>
    );
};

export default DemandDetail;
