
import React, { useState, useEffect } from 'react';
import { Group } from '../types';
import Modal from './Modal';

interface GroupEditModalProps {
    group: Group;
    onClose: () => void;
    onSave: (group: Group) => void;
}

const GroupEditModal: React.FC<GroupEditModalProps> = ({ group, onClose, onSave }) => {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description);
    const [isActive, setIsActive] = useState(group.isActive);

    useEffect(() => {
        setName(group.name);
        setDescription(group.description);
        setIsActive(group.isActive);
    }, [group]);

    const handleSave = () => {
        onSave({ ...group, name, description, isActive });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Editar Grupo: ${group.name}`}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-slate-700">Nome do Grupo</label>
                    <input
                        type="text"
                        id="groupName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                    />
                </div>
                <div>
                    <label htmlFor="groupDescription" className="block text-sm font-medium text-slate-700">Descrição/Categoria</label>
                    <select
                        id="groupDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                         className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                    >
                        <option>Serviços de Manutenção e Reparos</option>
                        <option>Materiais de Construção</option>
                    </select>
                </div>
                <div className="flex items-center pt-2">
                    <input
                        id="groupStatus"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="groupStatus" className="ml-2 block text-sm text-slate-900">
                        Grupo Ativo
                    </label>
                </div>
            </div>
             <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end space-x-3">
                 <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancelar
                </button>
                <button type="button" onClick={handleSave} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Salvar Alterações
                </button>
            </div>
        </Modal>
    );
};

export default GroupEditModal;
