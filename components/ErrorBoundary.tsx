import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full border border-red-100">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado (Critico)</h1>
                        <p className="text-slate-600 mb-4">Ocorreu um erro inesperado na aplicação.</p>

                        <div className="bg-slate-100 p-4 rounded-lg overflow-auto mb-4 max-h-96">
                            <p className="font-mono text-xs text-red-500 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre className="font-mono text-xs text-slate-500 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <button
                            onClick={() => { localStorage.clear(); window.location.reload(); }}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
                        >
                            Limpar Cache e Recarregar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
