
import React, { useState, useMemo } from 'react';
import { Demand, Supplier, DemandStatus } from '../types';
import PageHeader from './PageHeader';
import { DEPARTMENTS } from '../constants';
import { DownloadIcon, FilterIcon, SearchIcon, CalendarIcon, PrinterIcon } from './icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter } from '../utils/reportUtils';

interface ReportsPageProps {
    demands: Demand[];
    suppliers: Supplier[];
}

type SortField = 'id' | 'createdAt' | 'requestingDepartment' | 'totalValue' | 'status';
type SortDirection = 'asc' | 'desc';

const ReportsPage: React.FC<ReportsPageProps> = ({ demands, suppliers }) => {
    // State for filters
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // State for sorting
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedDemands = useMemo(() => {
        let filtered = demands.filter(d => {
            const matchesDepartment = !departmentFilter || d.requestingDepartment === departmentFilter;
            const matchesStatus = !statusFilter || d.status === statusFilter;
            const matchesSupplier = !supplierFilter || (d.winner?.supplierName.toLowerCase().includes(supplierFilter.toLowerCase()));

            const dDate = new Date(d.createdAt);
            const matchesStart = !startDate || dDate >= new Date(startDate);
            const matchesEnd = !endDate || dDate <= new Date(endDate);

            return matchesDepartment && matchesStatus && matchesSupplier && matchesStart && matchesEnd;
        });

        return filtered.sort((a, b) => {
            let valA: any = a[sortField as keyof Demand];
            let valB: any = b[sortField as keyof Demand];

            if (sortField === 'totalValue') {
                valA = a.winner?.totalValue || 0;
                valB = b.winner?.totalValue || 0;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [demands, departmentFilter, statusFilter, supplierFilter, startDate, endDate, sortField, sortDirection]);

    const exportToCSV = () => {
        const headers = ['ID', 'Protocolo', 'Data Criação', 'Departamento', 'Status', 'Fornecedor Vencedor', 'Valor Total', 'Data Decisão'];
        const csvRows = [headers.join(',')];

        filteredAndSortedDemands.forEach(d => {
            const row = [
                d.id,
                d.protocol,
                new Date(d.createdAt).toLocaleDateString('pt-BR'),
                `"${d.requestingDepartment}"`, // Quote strings that might contain commas
                d.status,
                `"${d.winner?.supplierName || '-'}"`,
                d.winner?.totalValue ? d.winner.totalValue.toFixed(2).replace('.', ',') : '0,00',
                d.decisionDate ? new Date(d.decisionDate).toLocaleDateString('pt-BR') : '-'
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const bob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(bob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_demandas_${new Date().toISOString().slice(0, 10)}.csv`);
        link.click();
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Add header
        addPDFHeader(doc, 'Relatório Analítico de Demandas');

        // Add summary of filters if any are active
        let filterText = 'Filtros aplicados: ';
        const activeFilters = [];
        if (startDate) activeFilters.push(`Início: ${new Date(startDate).toLocaleDateString('pt-BR')}`);
        if (endDate) activeFilters.push(`Fim: ${new Date(endDate).toLocaleDateString('pt-BR')}`);
        if (departmentFilter) activeFilters.push(`Dept: ${departmentFilter}`);
        if (statusFilter) activeFilters.push(`Status: ${statusFilter}`);
        if (supplierFilter) activeFilters.push(`Fornecedor: ${supplierFilter}`);

        let startY = 40; // Increased spacing from header

        if (activeFilters.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(filterText + activeFilters.join(' | '), 14, startY);
            startY += 10; // More breathing room after filters
        } else {
            startY += 5; // Add some minimal spacing if no filters
        }

        // Prepare data
        const tableData = filteredAndSortedDemands.map(d => [
            d.id,
            d.protocol,
            new Date(d.createdAt).toLocaleDateString('pt-BR'),
            d.requestingDepartment,
            d.status,
            d.winner?.supplierName || '-',
            d.winner?.totalValue ? d.winner.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
            d.decisionDate ? new Date(d.decisionDate).toLocaleDateString('pt-BR') : '-'
        ]);

        // Generate table
        autoTable(doc, {
            startY: startY,
            head: [['ID', 'Protocolo', 'Data', 'Departamento', 'Status', 'Fornecedor', 'Valor', 'Decisão']],
            body: tableData,
            headStyles: { fillColor: [22, 53, 92], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 245, 250] },
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 15 }, // ID
                1: { cellWidth: 30 }, // Protocol - Increased
                2: { cellWidth: 20 }, // Date
                3: { cellWidth: 40 }, // Department - Defined
                4: { cellWidth: 25 }, // Status - Defined
                5: { cellWidth: 'auto' }, // Supplier - Allow to take remaining space
                6: { cellWidth: 30, halign: 'right' }, // Value - Increased
                7: { cellWidth: 20, halign: 'center' } // Decision - Defined
            },
            margin: { top: 35, right: 14, bottom: 14, left: 14 }
        });

        // Add footer
        addPDFFooter(doc);

        doc.save(`relatorio_demandas_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const totalFilteredValue = filteredAndSortedDemands.reduce((acc, d) => acc + (d.winner?.totalValue || 0), 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Relatórios Analíticos" subtitle="Exportação e análise detalhada de dados" showButton={false} />

            {/* Filters Area */}
            {/* ... existing filters ... */}

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
                <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
                    <FilterIcon className="w-5 h-5 text-blue-600" />
                    <h3>Filtros Avançados</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Período (Início)</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Período (Fim)</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                        >
                            <option value="">Todos</option>
                            {Object.values(DemandStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secretaria</label>
                        <select
                            value={departmentFilter}
                            onChange={e => setDepartmentFilter(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                        >
                            <option value="">Todas</option>
                            {DEPARTMENTS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fornecedor (Nome)</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por fornecedor vencedor..."
                                value={supplierFilter}
                                onChange={e => setSupplierFilter(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions & Summary */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100 gap-4">
                <div className="text-blue-900">
                    <span className="font-bold text-lg">{filteredAndSortedDemands.length}</span> <span className="text-sm opacity-80">registros encontrados.</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-sm opacity-80">Valor Total:</span> <span className="font-bold text-lg">{totalFilteredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-5 py-2.5 rounded-lg font-semibold hover:bg-red-50 transition-colors shadow-sm"
                    >
                        <PrinterIcon className="w-5 h-5" /> Exportar PDF
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <DownloadIcon className="w-5 h-5" /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th
                                    onClick={() => handleSort('id')}
                                    className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('createdAt')}
                                    className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    Data {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('requestingDepartment')}
                                    className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    Departamento {sortField === 'requestingDepartment' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('status')}
                                    className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Fornecedor Vencedor
                                </th>
                                <th
                                    onClick={() => handleSort('totalValue')}
                                    className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    Valor {sortField === 'totalValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredAndSortedDemands.length > 0 ? (
                                filteredAndSortedDemands.map((demand) => (
                                    <tr key={demand.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{demand.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {demand.requestingDepartment}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${demand.status === DemandStatus.CONCLUIDA ? 'bg-green-100 text-green-800' :
                                                    demand.status === DemandStatus.CANCELADA ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                                {demand.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {demand.winner ? (
                                                <span className="font-medium text-slate-800">{demand.winner.supplierName}</span>
                                            ) : (
                                                <span className="text-slate-400 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                                            {demand.winner ? demand.winner.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum registro encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
