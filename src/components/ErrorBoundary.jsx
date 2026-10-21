import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Chunk stale após deploy → auto-reload uma vez (evita loop)
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Importing a module script failed');
    if (isChunkError && !sessionStorage.getItem('bp_chunk_reload')) {
      sessionStorage.setItem('bp_chunk_reload', '1');
      window.location.reload();
      return { hasError: false, error: null };
    }
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
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
          <AlertTriangle className="w-16 h-16 text-[#ff2e88] mb-4" />
          <h1 className="font-poster text-[32px] leading-none uppercase text-white mb-3 text-center">Oops! Algo deu errado</h1>
          <p className="text-[#a8a8a8] text-center mb-6 max-w-md">
            Desculpe, a aplicação encontrou um erro inesperado. Tente recarregar a página.
          </p>
          <details className="mb-6 bg-[#161616] border border-[#222222] p-4 rounded-[12px] max-w-md w-full text-xs text-[#c8c8c8]">
            <summary className="cursor-pointer font-semibold mb-2">Detalhes do erro</summary>
            <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          </details>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 h-12 px-6 rounded-full bg-[#ffd400] text-[#0a0a0a] font-extrabold active:scale-[0.98]"
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
