import React, { useState } from 'react';
import { XIcon, PrinterIcon, CheckIcon } from './icons';

interface PrintOptions {
    includeDescription: boolean;
    includeItems: boolean;
    includeRequester: boolean;
    includeWinner: boolean;
}

interface PrintOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: PrintOptions) => void;
    hasWinner: boolean;
}

const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({ isOpen, onClose, onConfirm, hasWinner }) => {
    const [options, setOptions] = useState<PrintOptions>({
        includeDescription: true,
        includeItems: true,
        includeRequester: true,
        includeWinner: true
    });

    if (!isOpen) return null;

    const toggle = (key: keyof PrintOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <PrinterIcon className="w-5 h-5 text-indigo-600" />
                        Personalizar Relatório
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-2">Selecione os dados que deseja incluir no PDF:</p>

                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.includeDescription ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                            {options.includeDescription && <CheckIcon className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={options.includeDescription} onChange={() => toggle('includeDescription')} />
                        <span className="text-slate-700 font-medium">Descrição da Necessidade</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.includeItems ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                            {options.includeItems && <CheckIcon className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={options.includeItems} onChange={() => toggle('includeItems')} />
                        <span className="text-slate-700 font-medium">Lista de Itens (Tabela)</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.includeRequester ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                            {options.includeRequester && <CheckIcon className="w-3.5 h-3.5" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={options.includeRequester} onChange={() => toggle('includeRequester')} />
                        <span className="text-slate-700 font-medium">Dados do Solicitante (Local)</span>
                    </label>

                    {hasWinner && (
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.includeWinner ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                {options.includeWinner && <CheckIcon className="w-3.5 h-3.5" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={options.includeWinner} onChange={() => toggle('includeWinner')} />
                            <span className="text-slate-700 font-medium">Dados da Homologação (Vencedor)</span>
                        </label>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg text-sm">Cancelar</button>
                    <button onClick={() => onConfirm(options)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 text-sm flex items-center gap-2">
                        <PrinterIcon className="w-4 h-4" />
                        Gerar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintOptionsModal;
