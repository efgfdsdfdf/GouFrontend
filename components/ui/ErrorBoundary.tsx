import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4">
          <div className="bg-[#141417] p-8 rounded-[2rem] border border-white/10 max-w-md w-full text-center">
            <h2 className="text-xl font-black mb-4">Something went wrong.</h2>
            <p className="text-zinc-400 mb-6 text-sm">{this.state.error?.message || "An unexpected error occurred."}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl w-full"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
