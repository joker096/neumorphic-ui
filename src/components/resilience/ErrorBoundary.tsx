import { Component, Suspense } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { detectBrowserLanguage } from "../../lib/i18n";
import { RefreshCw } from "lucide-react";
import { forceFreshReload, isChunkLoadError } from "../../lib/chunk-reload";
import { getErrorBoundaryString } from "../../constants/errorBoundaryStrings";

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

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
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

    // Stale chunk after a deploy: reload once with a cache-busted URL.
    if (isChunkLoadError(error)) {
      if (forceFreshReload(false)) {
        console.warn("[ErrorBoundary] Chunk load error — forcing fresh reload");
      } else {
        console.warn("[ErrorBoundary] Chunk load error — auto-reload already attempted recently");
      }
      return;
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
      const lang = detectBrowserLanguage();
      const fallbackT =
        t || ((key: string) => getErrorBoundaryString(lang, key as never));

      const errorMessage = this.state.error?.message || String(this.state.error);
      const chunkError = isChunkLoadError(this.state.error);

      if (typeof this.props.fallback === "function") {
        return (this.props.fallback as (error: Error) => ReactNode)(this.state.error!);
      }

      const fallback = this.props.fallback;
      if (fallback !== undefined) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-[var(--text-primary)] p-6">
          <div className="max-w-[500px] w-full rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            <h1 className="text-xl font-bold mb-2">{fallbackT("error.somethingWentWrong")}</h1>
            <p className="text-sm opacity-80 mb-3">
              {chunkError
                ? fallbackT("error.chunkLoadHint")
                : fallbackT("error.appStillRunning")}
            </p>
            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed bg-black/25 rounded-lg p-3 border border-[var(--border-color)] text-red-300 select-text">
              {errorMessage}
            </pre>
            <details className="mt-3 text-xs opacity-60">
              <summary className="cursor-pointer select-none">{fallbackT("error.errorDetails")}</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs bg-black/20 rounded-lg p-2 border border-[var(--border-color)]">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={chunkError ? () => forceFreshReload(true) : this.handleRetry}
              aria-label={chunkError ? fallbackT("error.reloadPage") : fallbackT("error.tryAgain")}
              title={chunkError ? fallbackT("error.reloadPage") : fallbackT("error.tryAgain")}
              className="mt-4 min-h-11 px-4 flex items-center justify-center gap-2 bg-[var(--accent)]/20 border border-[var(--accent)]/40 rounded-lg hover:bg-[var(--accent)]/30 transition-colors"
            >
              <RefreshCw size={16} />
              <span>{chunkError ? fallbackT("error.reloadPage") : fallbackT("error.tryAgain")}</span>
            </button>
          </div>
        </div>
      );

    }
    return <Suspense fallback={<SuspenseFallback lang={detectBrowserLanguage()} />}>{this.props.children}</Suspense>;
  }
}

const SuspenseFallback = ({ lang }: { lang: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-[var(--text-primary)]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-[var(--border-color)] border-t-white rounded-full animate-spin" />
      <p className="text-sm opacity-60">{getErrorBoundaryString(lang, "loading")}</p>
    </div>
  </div>
);

