
import { useToast } from '../contexts/ToastContext';
import React, { useState } from 'react';
import { Group } from '../types';
import Modal from './Modal';

interface GroupFormModalProps {
    onClose: () => void;
    onSave: (group: Omit<Group, 'id'>) => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ onClose, onSave }) => {
    const { warning } = useToast();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('Materiais de Construção');
    const [isActive, setIsActive] = useState(true);

    const handleSave = () => {
        if (name.trim()) {
            onSave({ name, description, isActive });
        } else {
            warning('O Nome do Grupo é obrigatório.');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Criar Novo Grupo">
            <div className="space-y-4">
                <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-slate-700">Nome do Grupo</label>
                    <input
                        type="text"
                        id="groupName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                        placeholder="Ex: Ferragens"
                        required
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
                        <option>Materiais de Construção</option>
                        <option>Serviços de Manutenção e Reparos</option>
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
                        Ativar grupo ao criar
                    </label>
                </div>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancelar
                </button>
                <button type="button" onClick={handleSave} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Criar Grupo
                </button>
            </div>
        </Modal>
    );
};

export default GroupFormModal;
