import React, { useState, useRef, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { LogoutIcon, LockClosedIcon, UserIcon } from './icons';
import ChangePasswordModal from './ChangePasswordModal';

interface UserDropdownProps {
  userProfile: Profile | null;
  onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ userProfile, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userProfile) return null;

  const getRoleAbbreviation = (role: string) => {
    switch (role) {
      case UserRole.GESTOR_SUPREMO: return 'ADM';
      case UserRole.CONTRATACOES: return 'CTR';
      case UserRole.ALMOXARIFADO: return 'ALM';
      case UserRole.SECRETARIA: return 'SEC';
      case UserRole.FORNECEDOR: return 'FOR';
      case UserRole.CIDADAO: return 'CID';
      default: return 'USR';
    }
  };

  const getInitials = (name: string) => {
    return (name || '').charAt(0).toUpperCase();
  };

  const fullName = userProfile.full_name || 'Usuário';

  // Extract just the first name or username part for display if it's an email
  const displayName = fullName.includes('@') 
    ? fullName.split('@')[0] 
    : fullName.split(' ')[0];

  return (
    <>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 focus:outline-none hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            <div className="text-right hidden md:block">
              <div className="font-bold text-sm text-slate-800 leading-tight">
                {displayName}
              </div>
              <div className="flex justify-end mt-0.5">
                <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider uppercase">
                    {getRoleAbbreviation(userProfile.role || 'USR')}
                </span>
              </div>
            </div>
            
            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm ring-2 ring-white">
              {getInitials(fullName)}
            </div>
            
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-down">
              <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                <p className="text-sm font-bold text-slate-800">{fullName}</p>
                <p className="text-xs text-slate-500">{userProfile.role}</p>
              </div>
              
              <button 
                onClick={() => {
                    setIsOpen(false);
                    setShowPasswordModal(true);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <LockClosedIcon className="h-4 w-4 mr-3 text-slate-400" />
                Alterar Senha
              </button>
              
              <div className="border-t border-slate-100 my-1"></div>
              
              <button 
                onClick={onLogout}
                className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogoutIcon className="h-4 w-4 mr-3" />
                Sair do Sistema
              </button>
            </div>
          )}
          <style>{`
            @keyframes fade-in-down {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down {
                animation: fade-in-down 0.2s ease-out forwards;
            }
          `}</style>
        </div>
        
        {showPasswordModal && (
            <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
    </>
  );
};

export default UserDropdown;