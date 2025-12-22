
import React, { useState, useMemo } from 'react';
import { Demand } from '../types';
import { STATUS_COLORS } from '../constants';

interface CalendarBoardProps {
    demands: Demand[];
    onSelectDemand: (demand: Demand) => void;
}

const CalendarBoard: React.FC<CalendarBoardProps> = ({ demands, onSelectDemand }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(monthStart.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const days = useMemo(() => {
        const d = new Date(startDate);
        const calendarDays = [];
        while (d <= endDate) {
            calendarDays.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return calendarDays;
    }, [currentDate]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const getEventsForDate = (date: Date) => {
        const dateString = date.toLocaleDateString('pt-BR');
        return demands.filter(d => {
            const proposalDeadline = d.proposalDeadline ? new Date(d.proposalDeadline).toLocaleDateString('pt-BR') : null;
            const deliveryDeadline = d.deadline ? new Date(d.deadline).toLocaleDateString('pt-BR') : null;
            return proposalDeadline === dateString || deliveryDeadline === dateString;
        });
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800 capitalize">
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700">
                        Hoje
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            
            <div className="flex-grow flex flex-col overflow-auto">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 sticky top-0 z-10">
                    {weekDays.map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {day}
                        </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 auto-rows-fr flex-grow bg-slate-200 gap-px border border-slate-200">
                    {days.map((day, idx) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toLocaleDateString() === new Date().toLocaleDateString();
                        const events = getEventsForDate(day);

                        return (
                            <div 
                                key={idx} 
                                className={`min-h-[100px] bg-white p-2 flex flex-col gap-1 transition-colors hover:bg-slate-50/80 ${!isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'text-slate-800'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : ''}`}>
                                        {day.getDate()}
                                    </span>
                                </div>
                                
                                <div className="flex-grow space-y-1 overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-slate-200">
                                    {events.map(demand => {
                                        const isProposal = new Date(demand.proposalDeadline || '').toLocaleDateString('pt-BR') === day.toLocaleDateString('pt-BR');
                                        return (
                                            <button 
                                                key={`${demand.id}-${isProposal ? 'prop' : 'del'}`}
                                                onClick={() => onSelectDemand(demand)}
                                                className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-medium border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md truncate ${
                                                    isProposal 
                                                    ? 'bg-amber-50 border-amber-200 text-amber-800' 
                                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                }`}
                                                title={`${demand.protocol} - ${demand.title} (${isProposal ? 'Fim Cotação' : 'Prazo Final'})`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isProposal ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                    <span className="truncate">{demand.title}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Prazo de Propostas (Encerramento)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Prazo de Entrega/Execução</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarBoard;
