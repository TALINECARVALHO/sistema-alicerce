
import React from 'react';
import { Profile, Notification } from '../types';
import UserDropdown from './UserDropdown';
import { BellIcon, SearchIcon, CheckCircleIcon, ClockIcon, MenuIcon } from './icons';

interface HeaderProps {
  userProfile: Profile | null;
  onLogout: () => void;
  notifications: Notification[];
  onMenuClick: () => void;
}

/**
 * Header component for the authenticated area of the system.
 * Provides global navigation aids, notifications, and user account access.
 */
const Header: React.FC<HeaderProps> = ({ userProfile, onLogout, notifications = [], onMenuClick }) => {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const hasNotifications = notifications.length > 0;

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-20 shadow-sm">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Search Bar - Hidden on mobile, useful for quick finding within the current context */}
      <div className="flex-1"></div>

      {/* Action Area: Notifications and Profile */}
      <div className="flex items-center gap-2 md:gap-4 ml-4">
        {/* Notification Bell - Visual cue for system alerts */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg transition-colors relative group ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Notificações"
          >
            <BellIcon className="w-6 h-6" />
            {hasNotifications && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-200"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-0 animate-fade-in-down z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-800">Notificações</h4>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{notifications.length} Novas</span>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {hasNotifications ? (
                  <div className="divide-y divide-slate-50">
                    {notifications.map(n => (
                      <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                            n.type === 'INFO' ? 'bg-blue-100 text-blue-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                            {n.type === 'SUCCESS' ? <CheckCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BellIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Você não tem novas notificações.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Account Access */}
        <UserDropdown userProfile={userProfile} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Header;
