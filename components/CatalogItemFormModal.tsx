
import React, { useState, useEffect, useMemo } from 'react';
import { CatalogItem, Group } from '../types';
import Modal from './Modal';
import { UNITS_OF_MEASURE } from '../constants';

interface CatalogItemFormModalProps {
    item: CatalogItem | null;
    groups: Group[];
    onClose: () => void;
    onSave: (item: any) => void;
}

const CatalogItemFormModal: React.FC<CatalogItemFormModalProps> = ({ item, groups, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [type, setType] = useState<'Material' | 'Serviço'>('Material');
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

    const isEditing = !!item;

    useEffect(() => {
        if (item) {
            setName(item.name);
            setUnit(item.unit);
            setSelectedGroups(item.groups || []);
            setType(item.type || 'Material');
        } else {
            // Reset form for new item
            setName('');
            setUnit('');
            setType('Material');
            setSelectedGroups([]);
        }
    }, [item]);

    // Clear selected groups when the item type changes to prevent miscategorization
    useEffect(() => {
        // This effect runs when type or isEditing changes.
        // If we are creating a new item, changing its type should clear the groups.
        if (!isEditing) {
            setSelectedGroups([]);
        }
    }, [type, isEditing]);


    const handleGroupChange = (groupId: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(g => g !== groupId)
                : [...prev, groupId]
        );
    };

    const [error, setError] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            setError('Nome do item é obrigatório.');
            return;
        }
        if (!unit.trim()) {
            setError('Unidade de medida é obrigatória.');
            return;
        }
        if (selectedGroups.length === 0) {
            setError('Selecione pelo menos um grupo/categoria.');
            return;
        }

        const itemData = {
            name,
            unit,
            groups: selectedGroups,
            type,
        };

        setError('');
        if (isEditing) {
            onSave({ ...item, ...itemData });
        } else {
            onSave(itemData);
        }
    };

    const filteredGroups = useMemo(() => {
        // Now allows selecting ANY active group regardless of type to prevent "hiding" groups.
        return groups.filter(g => g.isActive);
    }, [groups]);

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? `Editar Item: ${item.name}` : 'Criar Novo Item de Catálogo'}>
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}
                {isEditing && (
                    <div>
                        <label htmlFor="itemId" className="block text-sm font-medium text-slate-700">ID / Código do Item</label>
                        <div className="mt-1 block w-full rounded-md bg-slate-100 text-slate-500 border-slate-300 shadow-sm px-3 py-2">
                            {item.id}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">O ID não pode ser alterado.</p>
                    </div>
                )}
                <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-slate-700">Nome do Item</label>
                    <input
                        type="text"
                        id="itemName"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        placeholder="Ex: Fita Isolante 20m"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="itemUnit" className="block text-sm font-medium text-slate-700">Unidade de Medida</label>
                    <input
                        type="text"
                        id="itemUnit"
                        list="units-datalist"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        placeholder="Ex: un, m, kg, pç"
                        required
                    />
                    <datalist id="units-datalist">
                        {UNITS_OF_MEASURE.map(uom => <option key={uom} value={uom} />)}
                    </datalist>
                </div>
                <fieldset className="pt-2">
                    <legend className="text-sm font-medium text-slate-700 mb-2">Tipo de Item</legend>
                    <div className="flex gap-4">
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer flex-1 transition-all ${type === 'Material' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <input
                                type="radio"
                                name="itemType"
                                value="Material"
                                checked={type === 'Material'}
                                onChange={() => setType('Material')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                            <span className="ml-3 text-sm font-medium text-slate-800">Material</span>
                        </label>
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer flex-1 transition-all ${type === 'Serviço' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <input
                                type="radio"
                                name="itemType"
                                value="Serviço"
                                checked={type === 'Serviço'}
                                onChange={() => setType('Serviço')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                            <span className="ml-3 text-sm font-medium text-slate-800">Serviço</span>
                        </label>
                    </div>
                </fieldset>

                <fieldset className="pt-2">
                    <legend className="text-sm font-medium text-slate-700 mb-2">Grupos</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-50/80 border rounded-md">
                        {filteredGroups.length === 0 && <p className="text-sm text-slate-500 col-span-2 text-center py-4">Nenhum grupo ativo disponível.</p>}
                        {filteredGroups.map(group => (
                            <label key={group.id} className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all text-sm ${selectedGroups.includes(group.id) ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedGroups.includes(group.id)}
                                    onChange={() => handleGroupChange(group.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2.5 font-medium text-slate-800">{group.name}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancelar
                </button>
                <button type="button" onClick={handleSave} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    {isEditing ? 'Salvar Alterações' : 'Criar Item'}
                </button>
            </div>
        </Modal>
    );
};

export default CatalogItemFormModal;
