
import React, { useState, useMemo } from 'react';
import { CatalogItem, Group, UserRole, Demand } from '../types';
import { SearchIcon, PlusIcon, TagIcon, TrashIcon, CogIcon, ClockIcon, DollarIcon, CalendarIcon } from './icons';
import PageHeader from './PageHeader';
import { getPriceHistory, PriceHistoryEntry } from '../utils/priceHistory';
import Modal from './Modal';
import PriceHistoryModal from './PriceHistoryModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter } from '../utils/reportUtils';

interface CatalogProps {
    items: CatalogItem[];
    groups: Group[];
    userRole: UserRole;
    demands: Demand[];
    onNewItem: () => void;
    onEditItem: (item: CatalogItem) => void;
    onDeleteItem: (id: string) => Promise<void>;
    onNavigateToDemand?: (demandId: number) => void;
}

const Catalog: React.FC<CatalogProps> = ({ items, groups, userRole, demands, onNewItem, onEditItem, onDeleteItem, onNavigateToDemand }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
    const [historyItem, setHistoryItem] = useState<{ id: string, name: string } | null>(null);

    const canManage = [UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO, UserRole.ALMOXARIFADO].includes(userRole);

    // Group items logic
    const groupedItems = useMemo(() => {
        const groupsToShow = selectedGroupFilter === 'all'
            ? groups
            : groups.filter(g => g.id === selectedGroupFilter);

        const result = groupsToShow.map(group => {
            const groupItems = items.filter(item =>
                item.groups.includes(group.id) &&
                (
                    !searchTerm ||
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.id.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );

            groupItems.sort((a, b) => a.name.localeCompare(b.name));

            return {
                group,
                items: groupItems
            };
        });

        if (searchTerm) {
            return result.filter(g => g.items.length > 0);
        }

        return result;
    }, [items, groups, searchTerm, selectedGroupFilter]);

    const orphanedItems = useMemo(() => {
        if (selectedGroupFilter !== 'all') return [];
        return items.filter(item =>
            (!item.groups || item.groups.length === 0) &&
            (!searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [items, selectedGroupFilter, searchTerm]);

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add header
        addPDFHeader(doc, 'Relatório de Catálogo de Itens');

        // Add filter info below standard header
        if (selectedGroupFilter !== 'all') {
            const groupName = groups.find(g => g.id === selectedGroupFilter)?.name || 'Todos';
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Filtro de Grupo: ${groupName}`, 14, 38);
        }

        // Prepare data
        const tableData: any[] = [];
        groupedItems.forEach(({ group, items }) => {
            items.forEach(item => {
                tableData.push([
                    item.id,
                    item.name,
                    item.unit,
                    group.name
                ]);
            });
        });

        // Add orphaned items if view all
        if (selectedGroupFilter === 'all' && orphanedItems.length > 0) {
            orphanedItems.forEach(item => {
                tableData.push([
                    item.id,
                    item.name,
                    item.unit,
                    'Sem Grupo'
                ]);
            });
        }

        // Generate table
        // Generate table
        autoTable(doc, {
            startY: selectedGroupFilter !== 'all' ? 42 : 36,
            head: [['Código', 'Descrição', 'Unidade', 'Grupo']],
            body: tableData,
            headStyles: { fillColor: [22, 53, 92], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 245, 250] },
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25 },
                3: { cellWidth: 40 }
            },
            margin: { top: 35, right: 14, bottom: 14, left: 14 }
        });

        doc.save('relatorio-catalogo.pdf');
    };

    return (
        <div className="space-y-8 animate-fade-in-down">
            <PageHeader
                title="Catálogo de Itens"
                subtitle="Gerencie os materiais e serviços disponíveis para solicitação, organizados por grupos."
                buttonText="Novo Item"
                onButtonClick={onNewItem}
                showButton={canManage}
            >
                {canManage && (
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center justify-center space-x-2 bg-white text-slate-700 border border-slate-300 font-semibold px-5 py-3 rounded-lg shadow-sm hover:bg-slate-50 transition-all duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM21 12v5.25c0 .414-.336.75-.75.75H3.75a.75.75 0 01-.75-.75V12m18 0c0 .414-.336.75-.75.75H3.75a.75.75 0 01-.75-.75V12m18 0V8.25a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 8.25V12m18 0h-18" />
                        </svg>
                        <span>Relatório</span>
                    </button>
                )}
            </PageHeader>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar item em todos os grupos..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
                <select
                    value={selectedGroupFilter}
                    onChange={e => setSelectedGroupFilter(e.target.value)}
                    className="w-full md:w-72 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition px-3 py-2 bg-slate-50 font-medium text-slate-700"
                >
                    <option value="all">Ver Todos os Grupos</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>

            <div className="space-y-8">
                {groupedItems.length === 0 && orphanedItems.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200/80 border-dashed">
                        <TagIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600">Nenhum item encontrado</h3>
                        <p className="text-slate-500">Tente ajustar seus filtros de busca.</p>
                    </div>
                )}

                {groupedItems.map(({ group, items }) => (
                    <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200/80 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <div className={`w-2 h-6 rounded-full ${group.description === 'Materiais de Construção' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                    {group.name}
                                </h3>
                                <p className="text-xs text-slate-500 ml-4 mt-0.5">{group.description}</p>
                            </div>
                            <span className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                {items.length} itens
                            </span>
                        </div>

                        {items.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">Código</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Descrição</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">Unid.</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Último Vlr.</th>
                                            {canManage && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Ações</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {items.map(item => (
                                            <tr key={`${group.id}-${item.id}`} className="hover:bg-slate-50 transition-colors group/row">
                                                <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-400">{item.id}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{item.name}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs border border-slate-200">{item.unit}</span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm">
                                                    {(() => {
                                                        const hist = getPriceHistory(item.name, item.id, demands);
                                                        const last = hist.length > 0 ? hist[0] : null;
                                                        if (!last) return <span className="text-slate-300 italic text-xs">Sem hist.</span>;
                                                        return (
                                                            <button
                                                                onClick={() => setHistoryItem({ id: item.id, name: item.name })}
                                                                className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline group"
                                                            >
                                                                {last.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                <ClockIcon className="w-3.5 h-3.5 text-blue-300 group-hover:text-blue-500" />
                                                            </button>
                                                        );
                                                    })()}
                                                </td>
                                                {canManage && (
                                                    <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                            <button onClick={() => onEditItem(item)} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors" title="Editar">
                                                                <CogIcon className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => onDeleteItem(item.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors" title="Excluir">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm italic">
                                Nenhum item cadastrado neste grupo.
                            </div>
                        )}
                    </div>
                ))}

                {orphanedItems.length > 0 && (
                    <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-amber-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                                <span className="bg-amber-200 text-amber-800 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">!</span>
                                Itens sem Grupo
                            </h3>
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                {orphanedItems.length} itens
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-amber-100">
                                <tbody className="divide-y divide-amber-100 bg-white/50">
                                    {orphanedItems.map(item => (
                                        <tr key={item.id} className="hover:bg-amber-100/50 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-amber-700">{item.id}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{item.name}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">{item.unit}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                {canManage && (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => onEditItem(item)} className="text-amber-600 hover:text-amber-800 underline text-xs">Atribuir Grupo</button>
                                                        <button onClick={() => onDeleteItem(item.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors" title="Excluir">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Histórico Detalhado */}
            {historyItem && (
                <PriceHistoryModal
                    isOpen={true}
                    onClose={() => setHistoryItem(null)}
                    description={historyItem.name}
                    catalogItemId={historyItem.id}
                    demands={demands}
                    onNavigateToDemand={onNavigateToDemand}
                />
            )}

            <style>{`
@keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
}
                .animate-fade-in-down {
    animation: fade-in-down 0.4s ease-out forwards;
}
`}</style>
        </div>
    );
};

export default Catalog;
