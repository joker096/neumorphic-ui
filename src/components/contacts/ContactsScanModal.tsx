import { lazy, Suspense } from "react";
import { Scan } from "lucide-react";
import type { IScannerError } from "@yudiel/react-qr-scanner";
import { FormModal } from "../ui/FormModal";
import { DataState } from "../ui/DataState";

const ScannerLazy = lazy(() => import("@yudiel/react-qr-scanner").then((m) => ({ default: m.Scanner })));

type T = (key: string, options?: any) => string;

interface ContactsScanModalProps {
  isScanning: boolean;
  isDark: boolean;
  theme: "light" | "dark";
  scanError: IScannerError | null;
  scannerKey: number;
  t: T;
  onClose: () => void;
  onRetry: () => void;
  onError: (error: IScannerError) => void;
  onScanned: (value: string) => void;
}
export function ContactsScanModal({ isScanning, isDark, theme, scanError, scannerKey, t, onClose, onRetry, onError, onScanned }: ContactsScanModalProps) {
  return (
    <FormModal isOpen={isScanning} onClose={onClose}
      title={t('contacts.scanContactQR')} subtitle={t('contacts.scanDescription')}
      icon={Scan} theme={theme} closeTitle={t('contacts.close')}>
        <div className={`w-full aspect-square overflow-hidden relative shadow-inner rounded-xl ${isDark ? "bg-black" : "bg-black/5"}`}>
          {scanError ? (
            <DataState
              status="error"
              isDark={isDark}
              title={scanError.kind === 'permission-denied' ? t('contacts.cameraPermissionDenied') : t('contacts.cameraError')}
              retryAction={onRetry}
            />
          ) : (
            <>
              <Suspense fallback={null}>
                <ScannerLazy
                  key={scannerKey}
                  onScan={(result) => { if (result && result.length > 0) onScanned(result[0].rawValue); }}
                  onError={onError}
                  styles={{ container: { width: '100%', height: '100%' } }}
                />
              </Suspense>
              <div className="absolute inset-0 border-4 border-[var(--accent)]/50 pointer-events-none mix-blend-overlay rounded-xl" />
            </>
          )}
        </div>
    </FormModal>
  );
}
