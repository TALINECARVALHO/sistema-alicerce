
import React from 'react';
import { AlicerceIcon, QAIcon, UserIcon, LockClosedIcon, ChartBarIcon, BuildingIcon, ClipboardListIcon } from './icons';

interface PublicHeaderProps {
    currentView: 'transparency' | 'faq' | 'supplier' | 'login';
    onNavigate: (view: 'transparency' | 'faq' | 'supplier' | 'login') => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ currentView, onNavigate }) => {
    return (
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo Area */}
                    <div 
                        className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
                        onClick={() => onNavigate('transparency')}
                    >
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                            <AlicerceIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-white tracking-wide leading-none">Alicerce</h1>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5 group-hover:text-blue-400 transition-colors hidden sm:block">Portal da Transparência</p>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <nav className="hidden md:flex items-center gap-2">
                        <button
                            onClick={() => onNavigate('faq')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                currentView === 'faq' 
                                    ? 'bg-slate-800 text-white shadow-inner' 
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <QAIcon className="w-4 h-4 mr-2" />
                            Dúvidas Frequentes
                        </button>

                        <button
                            onClick={() => onNavigate('supplier')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                currentView === 'supplier' 
                                    ? 'bg-slate-800 text-white shadow-inner' 
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <BuildingIcon className="w-4 h-4 mr-2" />
                            Sou Fornecedor
                        </button>

                        <div className="h-6 w-px bg-slate-700 mx-2"></div>

                        <button
                            onClick={() => onNavigate('login')}
                            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-md whitespace-nowrap ${
                                currentView === 'login'
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                                    : 'bg-white text-slate-900 hover:bg-blue-50'
                            }`}
                        >
                            <LockClosedIcon className="w-4 h-4 mr-2" />
                            Área Restrita
                        </button>
                    </nav>

                    {/* Mobile Menu Icon (Simplified) */}
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={() => onNavigate('login')}
                            className="text-white bg-blue-600 p-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                            aria-label="Login"
                        >
                            <LockClosedIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Navigation Row */}
            <div className="md:hidden border-t border-slate-800 bg-slate-900 px-2 py-2 flex justify-between gap-1 overflow-x-auto">
                 <button onClick={() => onNavigate('faq')} className={`flex-1 text-xs font-medium py-2 px-2 rounded whitespace-nowrap text-center ${currentView === 'faq' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>
                    Dúvidas
                 </button>
                 <button onClick={() => onNavigate('supplier')} className={`flex-1 text-xs font-medium py-2 px-2 rounded whitespace-nowrap text-center ${currentView === 'supplier' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>
                    Fornecedor
                 </button>
                 <button onClick={() => onNavigate('transparency')} className={`flex-1 text-xs font-medium py-2 px-2 rounded whitespace-nowrap text-center ${currentView === 'transparency' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>
                    Dados
                 </button>
            </div>
        </header>
    );
};

export default PublicHeader;
