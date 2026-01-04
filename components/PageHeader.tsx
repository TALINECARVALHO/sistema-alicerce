
import React from 'react';
import { PlusIcon } from './icons';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    buttonText?: string;
    onButtonClick?: () => void;
    showButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, buttonText, onButtonClick, showButton = true, children }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
                <p className="mt-1.5 text-slate-600">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
                {children}
                {showButton && buttonText && onButtonClick && (
                    <button
                        onClick={onButtonClick}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>{buttonText}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PageHeader;