import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Translate = (key: string, options?: any) => string;

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  t?: Translate;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return (this.props.fallback as (error: Error) => ReactNode)(this.state.error!);
      }
      const { t } = this.props;
      const fallbackT = t || ((key: string) => key);
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-red-950 text-white p-6">
          <div className="max-w-md rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <h1 className="text-xl font-bold mb-2">{fallbackT('error.somethingWentWrong')}</h1>
            <p className="text-sm opacity-80 mb-3">
              {fallbackT('error.appStillRunning')}
            </p>
            <details className="text-xs opacity-60">
              <summary>{fallbackT('error.errorDetails')}</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px]">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
