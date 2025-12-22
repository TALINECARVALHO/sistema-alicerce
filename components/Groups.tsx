
import React, { useState, useMemo } from 'react';
import { Group } from '../types';
import PageHeader from './PageHeader';
import { SearchIcon, CogIcon, TrashIcon } from './icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter } from '../utils/reportUtils';

interface GroupsProps {
    groups: Group[];
    onEditGroup: (group: Group) => void;
    onToggleGroupStatus: (groupId: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onNewGroup: () => void;
}

const GroupCard: React.FC<{
    group: Group;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}> = ({ group, onEdit, onToggleStatus, onDelete }) => (
    <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
        <div className="flex-grow">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800">{group.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {group.isActive ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">ID: {group.id}</p>
            <p className="text-sm text-slate-600 mt-3">{group.description}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200/80 flex space-x-2">
            <button onClick={onEdit} className="px-3 py-1.5 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Editar</button>
            <button
                onClick={onToggleStatus}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${group.isActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
            >
                {group.isActive ? 'Desativar' : 'Ativar'}
            </button>
            <button onClick={onDelete} className="px-3 py-1.5 text-sm font-semibold bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors">Excluir</button>
        </div>
    </div>
);

const GroupTable: React.FC<{
    groups: Group[];
    onEdit: (g: Group) => void;
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ groups, onEdit, onToggleStatus, onDelete }) => (
    <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição/Categoria</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200/80">
                    {groups.map(group => (
                        <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{group.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{group.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{group.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {group.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onEdit(group)} className="text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition-colors" title="Editar">
                                        <CogIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => onToggleStatus(group.id)} className={`p-1 rounded transition-colors ${group.isActive ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`} title={group.isActive ? 'Desativar' : 'Ativar'}>
                                        <div className="w-5 h-5 flex items-center justify-center font-bold text-xs border border-current rounded-full">
                                            {group.isActive ? '!' : '✓'}
                                        </div>
                                    </button>
                                    <button onClick={() => onDelete(group.id)} className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors" title="Excluir">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const Groups: React.FC<GroupsProps> = ({ groups, onEditGroup, onToggleGroupStatus, onDeleteGroup, onNewGroup }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

    // Dynamically group items by their description
    const groupsByCategory = useMemo(() => {
        const filtered = groups.filter(g =>
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const categorized: Record<string, Group[]> = {};

        filtered.forEach(group => {
            const category = group.description || 'Sem Categoria';
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push(group);
        });

        // Sort categories to put "Materiais" and "Serviços" first if they exist, purely for aesthetics
        const sortedCategories = Object.keys(categorized).sort((a, b) => {
            if (a.includes('Materiais')) return -1;
            if (b.includes('Materiais')) return 1;
            return a.localeCompare(b);
        });

        return sortedCategories.map(category => ({
            title: category,
            items: categorized[category]
        }));
    }, [groups, searchTerm]);

    const renderGroupGrid = (title: string, groupList: Group[]) => (
        <div className="mb-10" key={title}>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupList.map(group => (
                    <GroupCard
                        key={group.id}
                        group={group}
                        onEdit={() => onEditGroup(group)}
                        onToggleStatus={() => onToggleGroupStatus(group.id)}
                        onDelete={() => onDeleteGroup(group.id)}
                    />
                ))}
            </div>
        </div>
    );

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add header
        addPDFHeader(doc, 'Relatório de Grupos e Categorias');

        // Prepare data
        const tableData = groups.map(group => [
            group.id,
            group.name,
            group.description,
            group.isActive ? 'Ativo' : 'Inativo'
        ]);

        // Generate table
        // Generate table
        autoTable(doc, {
            startY: 42,
            head: [['ID', 'Nome', 'Descrição', 'Status']],
            body: tableData,
            headStyles: { fillColor: [22, 53, 92], textColor: 255 }, // Alicerce Primary Blue
            alternateRowStyles: { fillColor: [240, 245, 250] },
            styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 25 }
            },
            margin: { top: 35, right: 14, bottom: 14, left: 14 }
        });

        // Add footer
        addPDFFooter(doc);

        doc.save(`relatorio_grupos_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Gestão de Grupos"
                subtitle="Gerencie as categorias de materiais e serviços do sistema"
                buttonText="Novo Grupo"
                onButtonClick={onNewGroup}
            >
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM21 12v5.25c0 .414-.336.75-.75.75H3.75a.75.75 0 01-.75-.75V12m18 0c0 .414-.336.75-.75.75H3.75a.75.75 0 01-.75-.75V12m18 0V8.25a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 8.25V12m18 0h-18" />
                    </svg>
                    Exportar PDF
                </button>
            </PageHeader>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar grupos por nome ou descrição..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg flex-shrink-0">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Visualização em Cards"
                    >
                        <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                            <div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div>
                            <div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div>
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Visualização em Lista"
                    >
                        <div className="flex flex-col gap-0.5 w-4 h-4 justify-center">
                            <div className="bg-current h-[1.5px] w-full rounded-full"></div>
                            <div className="bg-current h-[1.5px] w-full rounded-full"></div>
                            <div className="bg-current h-[1.5px] w-full rounded-full"></div>
                        </div>
                    </button>
                </div>
            </div>

            {viewMode === 'cards' ? (
                <div>
                    {groupsByCategory.length > 0 ? (
                        groupsByCategory.map(cat => renderGroupGrid(cat.title, cat.items))
                    ) : (
                        <div className="text-center py-6 bg-white rounded-xl shadow-sm border border-slate-200/80">
                            <p className="text-slate-500">Nenhum grupo encontrado.</p>
                        </div>
                    )}
                </div>
            ) : (
                <GroupTable
                    groups={groupsByCategory.flatMap(c => c.items)} // Use filtered list
                    onEdit={onEditGroup}
                    onToggleStatus={onToggleGroupStatus}
                    onDelete={onDeleteGroup}
                />
            )}
        </div>
    )
}

export default Groups;
