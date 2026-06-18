import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center p-6 glass-bg text-sans">
          <div className="w-full max-w-md glass-card rounded-[2.5rem] p-8 text-center space-y-6 border border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="text-red-400 animate-pulse" size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">Application Error</h2>
              <p className="text-xs text-white/60 font-bold uppercase tracking-wider">A runtime exception occurred</p>
            </div>
            <div className="glass-inset p-4 rounded-2xl text-left max-h-40 overflow-y-auto pr-1">
              <p className="text-xs font-black text-red-400 mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
            <button onClick={() => window.location.reload()} className="w-full p-4 glass-button text-blue-400 font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
