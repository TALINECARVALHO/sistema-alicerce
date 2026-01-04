import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Próxima
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-700 font-medium">
                        Mostrando <span className="font-bold text-blue-600">{startItem}</span> a <span className="font-bold text-blue-600">{endItem}</span> de{' '}
                        <span className="font-bold text-slate-900">{totalItems}</span> resultados
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px gap-1" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-blue-300 gap-2"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Anterior</span>
                        </button>
                        <div className="flex items-center gap-1">
                            {getPageNumbers().map((page, idx) => {
                                if (page === '...') {
                                    return (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-slate-400"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page as number)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all ${currentPage === page
                                            ? 'z-10 bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-100'
                                            : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-blue-300 gap-2"
                        >
                            <span>Próxima</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};
