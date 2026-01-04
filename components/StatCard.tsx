import React from 'react';

type ColorVariant = 'blue' | 'emerald' | 'amber' | 'purple' | 'red' | 'indigo' | 'orange';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    valueClassName?: string;
    className?: string;
    variant?: ColorVariant;
}

const VARIANTS: Record<ColorVariant, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50/80', text: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50/80', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50/80', text: 'text-amber-600', border: 'border-amber-100' },
    purple: { bg: 'bg-purple-50/80', text: 'text-purple-600', border: 'border-purple-100' },
    red: { bg: 'bg-red-50/80', text: 'text-red-600', border: 'border-red-100' },
    indigo: { bg: 'bg-indigo-50/80', text: 'text-indigo-600', border: 'border-indigo-100' },
    orange: { bg: 'bg-orange-50/80', text: 'text-orange-600', border: 'border-orange-100' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, valueClassName, className, variant = 'blue' }) => {
    const colors = VARIANTS[variant];

    return (
        <div className={`bg-white p-5 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-3 hover:-translate-y-1 transition-all duration-300 group ${className}`}>
            <div className={`p-3.5 rounded-2xl ${colors.bg} ${colors.text} ${colors.border} border shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm flex items-center justify-center`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-tight" title={title}>{title}</p>
                <div className={`text-lg sm:text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-none mb-0.5 ${valueClassName}`} title={String(value)}>
                    {value}
                </div>
                {subtitle && <p className="text-[10px] text-slate-400 font-medium opacity-80" title={subtitle}>{subtitle}</p>}
            </div>
        </div>
    );
};

export default StatCard;