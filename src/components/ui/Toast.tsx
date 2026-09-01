import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'progress';

export function toast(message: string, type: ToastType = 'info', id?: string): string | undefined {
  switch (type) {
    case 'success':
      sonnerToast.success(message);
      break;
    case 'error':
      sonnerToast.error(message);
      break;
    case 'warning':
      sonnerToast.warning(message);
      break;
    case 'progress':
      return toastProgress(message, id);
    default:
      sonnerToast.info(message);
      break;
  }
}

export function toastProgress(message: string, id?: string): string {
  const progressId = id ?? crypto.randomUUID();
  sonnerToast.loading(message, { id: progressId });
  return progressId;
}

export function dismissToast(id?: string): void {
  if (id === undefined) {
    sonnerToast.dismiss();
    return;
  }
  sonnerToast.dismiss(id);
}
