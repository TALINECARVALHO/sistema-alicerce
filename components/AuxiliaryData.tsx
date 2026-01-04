
import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { Department, UnitOfMeasure, DeliveryLocation } from '../types';
import { useToast } from '../contexts/ToastContext';
import { DEPARTMENTS, UNITS_OF_MEASURE } from '../constants';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon, ChevronUpIcon, ChevronDownIcon } from './icons';

interface AuxiliaryDataProps {
    onDataChange?: () => void;
}

const AuxiliaryData: React.FC<AuxiliaryDataProps> = ({ onDataChange }) => {
    const { success, error } = useToast();
    const [activeTab, setActiveTab] = useState<'departments' | 'units' | 'locations'>('departments');

    const [departments, setDepartments] = useState<Department[]>([]);
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [locations, setLocations] = useState<DeliveryLocation[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(false);

    // Forms
    const [newDeptName, setNewDeptName] = useState('');
    const [newUnitName, setNewUnitName] = useState('');
    const [newUnitSymbol, setNewUnitSymbol] = useState('');
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationAddress, setNewLocationAddress] = useState('');

    // Editing State
    const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
    const [editDeptName, setEditDeptName] = useState('');

    const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
    const [editUnitName, setEditUnitName] = useState('');
    const [editUnitSymbol, setEditUnitSymbol] = useState('');

    const [editingLocId, setEditingLocId] = useState<number | null>(null);
    const [editLocName, setEditLocName] = useState('');
    const [editLocAddress, setEditLocAddress] = useState('');

    // Sorting State
    const [sortColumn, setSortColumn] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortedData = <T,>(data: T[], nameKey: keyof T = 'name' as keyof T): T[] => {
        return [...data].sort((a, b) => {
            let valA: any = a[sortColumn as keyof T];
            let valB: any = b[sortColumn as keyof T];

            if (sortColumn === 'name') {
                valA = a[nameKey as keyof T];
                valB = b[nameKey as keyof T];
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const SortIndicator = ({ column }: { column: string }) => {
        if (sortColumn !== column) return <span className="w-4 h-4 inline-block ml-1 opacity-20"><ChevronDownIcon /></span>;
        return (
            <span className="w-4 h-4 inline-block ml-1 text-blue-600">
                {sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </span>
        );
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [depts, unitsData, locs] = await Promise.all([
                api.fetchDepartments(),
                api.fetchUnits(),
                api.fetchDeliveryLocations()
            ]);
            setDepartments(depts);
            setUnits(unitsData);
            setLocations(locs);

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddDept = async () => {
        if (!newDeptName.trim()) return;
        try {
            await api.createDepartment(newDeptName);
            setNewDeptName('');
            loadData();
            if (onDataChange) onDataChange();
            success("Secretaria adicionada!");
        } catch (e: any) {
            error("Erro ao adicionar secretaria. Verifique se a tabela 'departments' existe no Supabase.");
        }
    };

    const handleDeleteDept = async (id: number) => {
        if (!confirm("Tem certeza?")) return;
        try {
            await api.deleteDepartment(id);
            loadData();
            if (onDataChange) onDataChange();
            success("Secretaria excluída.");
        } catch (e: any) {
            error("Erro ao excluir: " + api.formatError(e));
        }
    };

    const handleAddUnit = async () => {
        if (!newUnitName.trim() || !newUnitSymbol.trim()) return;
        try {
            await api.createUnit({ name: newUnitName, symbol: newUnitSymbol, active: true });
            setNewUnitName('');
            setNewUnitSymbol('');
            loadData();
            if (onDataChange) onDataChange();
            success("Unidade adicionada!");
        } catch (e: any) {
            error("Erro ao adicionar unidade. Verifique se a tabela 'units' existe no Supabase.");
        }
    };

    const handleDeleteUnit = async (id: number) => {
        if (!confirm("Tem certeza?")) return;
        try {
            await api.deleteUnit(id);
            loadData();
            if (onDataChange) onDataChange();
            success("Unidade excluída.");
        } catch (e: any) {
            error("Erro ao excluir: " + api.formatError(e));
        }
    };

    const handleAddLocation = async () => {
        if (!newLocationName.trim()) return;
        try {
            await api.createDeliveryLocation({ name: newLocationName, address: newLocationAddress, active: true });
            setNewLocationName('');
            setNewLocationAddress('');
            loadData();
            if (onDataChange) onDataChange();
            success("Local adicionado!");
        } catch (e: any) {
            error("Erro ao adicionar local. Verifique se a tabela 'delivery_locations' existe no Supabase.");
        }
    };

    const handleDeleteLocation = async (id: number) => {
        if (!confirm("Tem certeza?")) return;
        try {
            await api.deleteDeliveryLocation(id);
            loadData();
            if (onDataChange) onDataChange();
            success("Local excluído.");
        } catch (e: any) {
            error("Erro ao excluir: " + api.formatError(e));
        }
    };

    const handleToggleDept = async (dept: Department) => {
        try {
            await api.updateDepartment({ ...dept, active: !dept.active });
            loadData();
            if (onDataChange) onDataChange();
            success(`Secretaria ${!dept.active ? 'ativada' : 'desativada'}.`);
        } catch (e: any) {
            error("Erro ao atualizar: " + api.formatError(e));
        }
    };

    const handleToggleUnit = async (unit: UnitOfMeasure) => {
        try {
            await api.updateUnit({ ...unit, active: !unit.active });
            loadData();
            if (onDataChange) onDataChange();
            success(`Unidade ${!unit.active ? 'ativada' : 'desativada'}.`);
        } catch (e: any) {
            error("Erro ao atualizar: " + api.formatError(e));
        }
    };

    const handleToggleLocation = async (loc: DeliveryLocation) => {
        try {
            await api.updateDeliveryLocation({ ...loc, active: !loc.active });
            loadData();
            if (onDataChange) onDataChange();
            success(`Local ${!loc.active ? 'ativado' : 'desativado'}.`);
        } catch (e: any) {
            error("Erro ao atualizar: " + api.formatError(e));
        }
    };

    const handleSeedParams = async () => {
        if (!confirm("Deseja importar as secretarias e unidades padrão? Isso irá tentar criar registros nas tabelas.")) return;
        try {
            for (const d of DEPARTMENTS) {
                await api.createDepartment(d);
            }
            for (const u of UNITS_OF_MEASURE) {
                await api.createUnit({ name: 'Padrão', symbol: u, active: true });
            }
            loadData();
            if (onDataChange) onDataChange();
            success("Dados padrão importados!");
        } catch (e: any) {
            error("Erro na importação: " + e.message);
        }
    }

    const handleSaveDept = async (id: number) => {
        if (!editDeptName.trim()) return;
        try {
            const dept = departments.find(d => d.id === id);
            if (dept) {
                await api.updateDepartment({ ...dept, name: editDeptName });
                setEditingDeptId(null);
                loadData();
                if (onDataChange) onDataChange();
                success("Secretaria atualizada!");
            }
        } catch (e: any) {
            error("Erro ao atualizar: " + api.formatError(e));
        }
    };

    const handleSaveUnit = async (id: number) => {
        if (!editUnitName.trim() || !editUnitSymbol.trim()) return;
        try {
            const unit = units.find(u => u.id === id);
            if (unit) {
                await api.updateUnit({ ...unit, name: editUnitName, symbol: editUnitSymbol });
                setEditingUnitId(null);
                loadData();
                if (onDataChange) onDataChange();
                success("Unidade atualizada!");
            }
        } catch (e: any) {
            error("Erro ao atualizar: " + api.formatError(e));
        }
    };

    const handleSaveLocation = async (id: number) => {
        if (!editLocName.trim()) return;
        try {
            const loc = locations.find(l => l.id === id);
            if (loc) {
                await api.updateDeliveryLocation({ ...loc, name: editLocName, address: editLocAddress });
                setEditingLocId(null);
                loadData();
                if (onDataChange) onDataChange();
                success("Local atualizado!");
            }
        } catch (e: any) {
            error("Erro ao atualizar: " + api.formatError(e));
        }
    };



    return (
        <div className="space-y-6">
            {/* ... (Keep header buttons) ... */}
            <div className="flex gap-4 border-b border-slate-200 pb-4">
                <button
                    onClick={() => { setActiveTab('departments'); setSortColumn('name'); }}
                    className={`font-bold pb-2 border-b-2 transition-colors ${activeTab === 'departments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Secretarias
                </button>
                <button
                    onClick={() => { setActiveTab('units'); setSortColumn('name'); }}
                    className={`font-bold pb-2 border-b-2 transition-colors ${activeTab === 'units' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Unidades de Medida
                </button>
                <button
                    onClick={() => { setActiveTab('locations'); setSortColumn('name'); }}
                    className={`font-bold pb-2 border-b-2 transition-colors ${activeTab === 'locations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Locais de Entrega
                </button>
            </div>

            {/* Departments */}
            {activeTab === 'departments' && (
                <div className="space-y-4">
                    {/* ... (Keep Add Input) ... */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newDeptName}
                            onChange={e => setNewDeptName(e.target.value)}
                            placeholder="Nome da Secretaria"
                            className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-3 py-2"
                        />
                        <button onClick={handleAddDept} className="bg-blue-600 text-white px-4 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                            <PlusIcon className="w-4 h-4" /> Adicionar
                        </button>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">Nome <SortIndicator column="name" /></div>
                                    </th>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('active')}>
                                        <div className="flex items-center">Status <SortIndicator column="active" /></div>
                                    </th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {departments.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-400">
                                            Nenhuma secretaria cadastrada ou erro ao carregar.
                                            <div className="mt-2">
                                                <button onClick={handleSeedParams} className="text-blue-600 underline text-xs">Tentar Importar Padrões</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {getSortedData(departments).map(d => (
                                    <tr key={d.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-700">
                                            {editingDeptId === d.id ? (
                                                <input
                                                    type="text"
                                                    value={editDeptName}
                                                    onChange={e => setEditDeptName(e.target.value)}
                                                    className="w-full rounded border-slate-300 px-2 py-1"
                                                />
                                            ) : d.name}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleDept(d)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${d.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                            >
                                                {d.active ? 'ATIVA' : 'INATIVA'}
                                            </button>
                                        </td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            {editingDeptId === d.id ? (
                                                <>
                                                    <button onClick={() => handleSaveDept(d.id)} className="text-green-600 hover:text-green-800 p-1" title="Salvar">
                                                        <CheckIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => setEditingDeptId(null)} className="text-slate-400 hover:text-slate-600 p-1" title="Cancelar">
                                                        <XIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => { setEditingDeptId(d.id); setEditDeptName(d.name); }} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteDept(d.id)} className="text-red-400 hover:text-red-600 p-1" title="Excluir">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Units */}
            {activeTab === 'units' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newUnitName}
                            onChange={e => setNewUnitName(e.target.value)}
                            placeholder="Nome (Ex: Quilograma)"
                            className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-3 py-2"
                        />
                        <input
                            type="text"
                            value={newUnitSymbol}
                            onChange={e => setNewUnitSymbol(e.target.value)}
                            placeholder="Símbolo (Ex: kg)"
                            className="w-32 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-3 py-2"
                        />
                        <button onClick={handleAddUnit} className="bg-blue-600 text-white px-4 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                            <PlusIcon className="w-4 h-4" /> Adicionar
                        </button>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">Nome <SortIndicator column="name" /></div>
                                    </th>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('symbol')}>
                                        <div className="flex items-center">Símbolo <SortIndicator column="symbol" /></div>
                                    </th>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('active')}>
                                        <div className="flex items-center">Status <SortIndicator column="active" /></div>
                                    </th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {units.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-400">
                                            Nenhuma unidade cadastrada.
                                            <div className="mt-2">
                                                <button onClick={handleSeedParams} className="text-blue-600 underline text-xs">Tentar Importar Padrões</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {getSortedData(units).map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-700">
                                            {editingUnitId === u.id ? (
                                                <input
                                                    type="text"
                                                    value={editUnitName}
                                                    onChange={e => setEditUnitName(e.target.value)}
                                                    className="w-full rounded border-slate-300 px-2 py-1"
                                                />
                                            ) : u.name}
                                        </td>
                                        <td className="p-3 font-mono text-slate-500">
                                            {editingUnitId === u.id ? (
                                                <input
                                                    type="text"
                                                    value={editUnitSymbol}
                                                    onChange={e => setEditUnitSymbol(e.target.value)}
                                                    className="w-20 rounded border-slate-300 px-2 py-1"
                                                />
                                            ) : u.symbol}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleUnit(u)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${u.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                            >
                                                {u.active ? 'ATIVA' : 'INATIVA'}
                                            </button>
                                        </td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            {editingUnitId === u.id ? (
                                                <>
                                                    <button onClick={() => handleSaveUnit(u.id)} className="text-green-600 hover:text-green-800 p-1" title="Salvar">
                                                        <CheckIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => setEditingUnitId(null)} className="text-slate-400 hover:text-slate-600 p-1" title="Cancelar">
                                                        <XIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => { setEditingUnitId(u.id); setEditUnitName(u.name); setEditUnitSymbol(u.symbol); }} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteUnit(u.id)} className="text-red-400 hover:text-red-600 p-1" title="Excluir">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delivery Locations */}
            {activeTab === 'locations' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={newLocationName}
                                onChange={e => setNewLocationName(e.target.value)}
                                placeholder="Nome do Local (Ex: Almoxarifado Central)"
                                className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-3 py-2"
                            />
                            <input
                                type="text"
                                value={newLocationAddress}
                                onChange={e => setNewLocationAddress(e.target.value)}
                                placeholder="Endereço (Opcional)"
                                className="flex-[2] rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-3 py-2"
                            />
                        </div>
                        <button onClick={handleAddLocation} className="bg-blue-600 text-white px-4 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                            <PlusIcon className="w-4 h-4" /> Adicionar
                        </button>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">Nome do Local <SortIndicator column="name" /></div>
                                    </th>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('address')}>
                                        <div className="flex items-center">Endereço <SortIndicator column="address" /></div>
                                    </th>
                                    <th className="p-3 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('active')}>
                                        <div className="flex items-center">Status <SortIndicator column="active" /></div>
                                    </th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {locations.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-400">
                                            Nenhum local cadastrado.
                                        </td>
                                    </tr>
                                )}
                                {getSortedData(locations).map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-700">
                                            {editingLocId === l.id ? (
                                                <input
                                                    type="text"
                                                    value={editLocName}
                                                    onChange={e => setEditLocName(e.target.value)}
                                                    className="w-full rounded border-slate-300 px-2 py-1"
                                                />
                                            ) : l.name}
                                        </td>
                                        <td className="p-3 text-slate-500">
                                            {editingLocId === l.id ? (
                                                <input
                                                    type="text"
                                                    value={editLocAddress}
                                                    onChange={e => setEditLocAddress(e.target.value)}
                                                    className="w-full rounded border-slate-300 px-2 py-1"
                                                />
                                            ) : (l.address || '-')}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleLocation(l)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${l.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                            >
                                                {l.active ? 'ATIVA' : 'INATIVA'}
                                            </button>
                                        </td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            {editingLocId === l.id ? (
                                                <>
                                                    <button onClick={() => handleSaveLocation(l.id)} className="text-green-600 hover:text-green-800 p-1" title="Salvar">
                                                        <CheckIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => setEditingLocId(null)} className="text-slate-400 hover:text-slate-600 p-1" title="Cancelar">
                                                        <XIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => { setEditingLocId(l.id); setEditLocName(l.name); setEditLocAddress(l.address || ''); }} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteLocation(l.id)} className="text-red-400 hover:text-red-600 p-1" title="Excluir">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuxiliaryData;
