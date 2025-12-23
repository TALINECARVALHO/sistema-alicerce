
import React from 'react';
import { Page } from '../types';
import { UserRole, Profile } from '../types';
import {
  AlicerceIcon,
  HomeIcon,
  GroupsIcon,
  TruckIcon,
  ClipboardListIcon,
  BoxIcon,
  QAIcon,
  MegaphoneIcon,
  ReportsIcon,
  UserIcon,
  UsersIcon,
  CogIcon,
  LogoutIcon,
  SparklesIcon,
  MailIcon
} from './icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  userProfile: Profile | null;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemConfig {
  page: string;
  icon: React.ReactNode;
  label: string;
}

interface NavSection {
  title?: string;
  items: NavItemConfig[];
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${isActive
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
        {icon}
      </span>
      <span className="ml-3 font-medium text-sm tracking-wide">{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm"></div>
      )}
    </a>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, userProfile, onLogout, isOpen = false, onClose }) => {
  const userRole = userProfile?.role as UserRole;

  const navConfig: Record<string, NavSection[]> = {
    [UserRole.GESTOR_SUPREMO]: [
      {
        items: [
          { page: 'dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
          { page: 'demands', icon: <ClipboardListIcon className="w-5 h-5" />, label: 'Demandas' },
          { page: 'qa', icon: <QAIcon className="w-5 h-5" />, label: 'Dúvidas & Respostas' },
          { page: 'users', icon: <UsersIcon className="w-5 h-5" />, label: 'Usuários' },
          { page: 'suppliers', icon: <TruckIcon className="w-5 h-5" />, label: 'Fornecedores' },
          { page: 'settings', icon: <CogIcon className="w-5 h-5" />, label: 'Configurações' },
          { page: 'reports', icon: <ReportsIcon className="w-5 h-5" />, label: 'Relatórios' },
        ]
      }
    ],
    [UserRole.CONTRATACOES]: [
      {
        title: 'Visão Geral',
        items: [
          { page: 'dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
        ]
      },
      {
        title: 'Gestão',
        items: [
          { page: 'demands', icon: <ClipboardListIcon className="w-5 h-5" />, label: 'Demandas' },
          { page: 'suppliers', icon: <TruckIcon className="w-5 h-5" />, label: 'Fornecedores' },
          { page: 'qa', icon: <QAIcon className="w-5 h-5" />, label: 'Dúvidas & Respostas' },
        ]
      },
      {
        title: 'Cadastros',
        items: [
          { page: 'settings', icon: <CogIcon className="w-5 h-5" />, label: 'Configurações' },
        ]
      },
      {
        title: 'Relatórios',
        items: [
          { page: 'reports', icon: <ReportsIcon className="w-5 h-5" />, label: 'Estatísticas' },

        ]
      }
    ],
    [UserRole.SECRETARIA]: [
      {
        items: [
          { page: 'dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
          { page: 'demands', icon: <ClipboardListIcon className="w-5 h-5" />, label: 'Minhas Demandas' },
          { page: 'training', icon: <SparklesIcon className="w-5 h-5" />, label: 'Guia de Uso (Curso)' },
          { page: 'reports', icon: <ReportsIcon className="w-5 h-5" />, label: 'Relatórios' },

        ]
      }
    ],
    [UserRole.ALMOXARIFADO]: [
      {
        title: 'Visão Geral',
        items: [
          { page: 'dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
        ]
      },
      {
        title: 'Operacional',
        items: [
          { page: 'demands', icon: <ClipboardListIcon className="w-5 h-5" />, label: 'Análise de Demandas' },
          { page: 'settings', icon: <CogIcon className="w-5 h-5" />, label: 'Configurações' },
        ]
      },
      {
        title: 'Dados',
        items: [
          { page: 'reports', icon: <ReportsIcon className="w-5 h-5" />, label: 'Relatórios' },

        ]
      }
    ],
    [UserRole.FORNECEDOR]: [
      {
        items: [
          { page: 'supplier_dashboard', icon: <HomeIcon className="w-5 h-5" />, label: 'Dashboard' },
          { page: 'demands', icon: <ClipboardListIcon className="w-5 h-5" />, label: 'Oportunidades' },
          { page: 'supplier_qa', icon: <QAIcon className="w-5 h-5" />, label: 'Minhas Dúvidas' },
          { page: 'training', icon: <SparklesIcon className="w-5 h-5" />, label: 'Manual do Fornecedor' },
          { page: 'supplier_data', icon: <UserIcon className="w-5 h-5" />, label: 'Meus Dados' },
          { page: 'supplier_reports', icon: <ReportsIcon className="w-5 h-5" />, label: 'Meus Relatórios' },

        ]
      }
    ],
    [UserRole.CIDADAO]: [
      {
        items: [
          { page: 'transparency', icon: <MegaphoneIcon className="w-5 h-5" />, label: 'Portal da Transparência' },
        ]
      }
    ]
  };

  const navSections = navConfig[userRole] || [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white flex flex-col flex-shrink-0 h-screen transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:inset-auto md:shadow-2xl border-r border-slate-800 font-sans ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex items-center h-20 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3 w-full">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center transform transition-transform hover:scale-105">
              <AlicerceIcon className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white tracking-wide leading-none">Alicerce</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Gestão Municipal</p>
            </div>
            <button
              onClick={onClose}
              className="md:hidden ml-auto p-1 text-slate-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="space-y-8">
            {navSections.map((section, index) => (
              <div key={index}>
                {section.title && (
                  <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 opacity-80">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {section.items.map(item => (
                    <NavItem
                      key={item.page}
                      icon={item.icon}
                      label={item.label}
                      isActive={currentPage === item.page}
                      onClick={() => {
                        setCurrentPage(item.page as Page);
                        if (onClose) onClose(); // Auto-close on mobile selection
                      }}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 mb-1">Prefeitura Municipal</p>
            <p className="text-[10px] text-slate-600 font-medium">v1.2.6 &copy; 2025</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
