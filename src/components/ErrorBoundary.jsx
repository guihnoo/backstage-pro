import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';

const FALLBACK_PRIMARY = getCategoryConfig(AUTH_HERO_CATEGORY).primaryHex;

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Oops! Algo deu errado</h1>
          <p className="text-slate-400 text-center mb-6 max-w-md">
            Desculpe, a aplicação encontrou um erro inesperado. Tente recarregar a página.
          </p>
          <details className="mb-6 bg-slate-800 p-4 rounded-lg max-w-md w-full text-xs text-slate-300">
            <summary className="cursor-pointer font-semibold mb-2">Detalhes do erro</summary>
            <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          </details>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90"
            style={{ backgroundColor: FALLBACK_PRIMARY }}
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
