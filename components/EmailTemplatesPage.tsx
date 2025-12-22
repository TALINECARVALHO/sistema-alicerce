import React from 'react';
import { MailIcon } from './icons';

const EmailTemplatesPage: React.FC = () => {
    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <MailIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Modelos de E-mail</h1>
                    <p className="text-slate-500">Gerencie os templates de notificação do sistema.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MailIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Em Desenvolvimento</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    A funcionalidade de edição de templates de e-mail estará disponível em breve.
                    Por enquanto, as notificações utilizam os modelos padrão do sistema.
                </p>
            </div>
        </div>
    );
};

export default EmailTemplatesPage;
