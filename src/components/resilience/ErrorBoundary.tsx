import { Component, Suspense } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Translate = (key: string, options?: any) => string;

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  t?: Translate;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
};

const MAX_ERROR_COUNT = 5;
const RESET_INTERVAL = 60000; // 60 seconds

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null, errorCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const newCount = this.state.errorCount + 1;
    this.setState({
      hasError: true,
      error,
      errorInfo,
      errorCount: newCount,
    });

    // Log to console for debugging
    console.error(`[ErrorBoundary] Caught error (${newCount}/${MAX_ERROR_COUNT}):`, error);

    // Call external onError handler if provided
    const { onError } = this.props;
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (e) {
        console.error("[ErrorBoundary] onError callback failed:", e);
      }
    }

    // Auto-reset if not too many errors
    if (newCount >= MAX_ERROR_COUNT) {
      console.warn("[ErrorBoundary] Max error count reached. Manual intervention may be needed.");
      return;
    }

    // Reset after interval
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.resetTimer = setTimeout(() => {
      this.setState({ hasError: false, error: null, errorInfo: null, errorCount: 0 });
    }, RESET_INTERVAL);
  }

  componentWillUnmount() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      const fallbackT = t || ((key: string) => key);

      if (typeof this.props.fallback === "function") {
        return (this.props.fallback as (error: Error) => ReactNode)(this.state.error!);
      }

      const fallback = this.props.fallback;
      if (fallback !== undefined) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-[var(--text-primary)] p-6">
          <div className="max-w-[500px] w-full rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <h1 className="text-xl font-bold mb-2">{fallbackT("error.somethingWentWrong")}</h1>
            <p className="text-sm opacity-80 mb-3">
              {fallbackT("error.appStillRunning")}
            </p>
            <details className="text-xs opacity-60">
              <summary>{fallbackT("error.errorDetails")}</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px]">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={this.handleRetry}
              className="mt-4 px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              {fallbackT("error.tryAgain")}
            </button>
          </div>
        </div>
      );

    }
    return <Suspense fallback={<SuspenseFallback />}>{this.props.children}</Suspense>;
  }
}

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-[var(--text-primary)]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-[var(--border-color)] border-t-white rounded-full animate-spin" />
      <p className="text-sm opacity-60">Loading...</p>
    </div>
  </div>
);

