
import React, { useState } from 'react';
import Modal from './Modal';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (reason.trim() === '') {
            setError('A justificativa é obrigatória.');
            return;
        }
        onConfirm(reason);
        setReason('');
        setError('');
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reprovar Demanda">
            <div className="space-y-4">
                <div>
                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700">Justificativa da Reprovação</label>
                    <textarea
                        id="rejectionReason"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError('');
                        }}
                        className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 ${error ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
                        rows={4}
                        placeholder="Descreva o motivo pelo qual esta demanda está sendo reprovada..."
                    />
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
                <p className="text-xs text-slate-500">
                    A justificativa será registrada e visível para o departamento solicitante. Esta ação não pode ser desfeita.
                </p>
            </div>
             <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end space-x-3">
                 <button type="button" onClick={handleClose} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancelar
                </button>
                <button type="button" onClick={handleConfirm} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                    Confirmar Reprovação
                </button>
            </div>
        </Modal>
    );
};

export default RejectionModal;
