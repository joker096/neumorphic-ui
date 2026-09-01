import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissToast, toast, toastProgress } from './Toast';

const sonnerToast = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  loading: vi.fn((message: string, options?: { id?: string }) => options?.id ?? 'generated-id'),
  dismiss: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: sonnerToast,
}));

describe('Toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes success/info/warning/error to sonner', () => {
    toast('Success', 'success');
    toast('Info');
    toast('Warning', 'warning');
    toast('Error', 'error');

    expect(sonnerToast.success).toHaveBeenCalledWith('Success');
    expect(sonnerToast.info).toHaveBeenCalledWith('Info');
    expect(sonnerToast.warning).toHaveBeenCalledWith('Warning');
    expect(sonnerToast.error).toHaveBeenCalledWith('Error');
  });

  it('creates a progress toast with generated id', () => {
    const id = toast('Uploading', 'progress');

    expect(sonnerToast.loading).toHaveBeenCalledWith('Uploading', { id: expect.any(String) });
    expect(id).toBeTypeOf('string');
  });

  it('creates a progress toast with explicit id', () => {
    const id = toastProgress('Uploading', 'upload-id');

    expect(sonnerToast.loading).toHaveBeenCalledWith('Uploading', { id: 'upload-id' });
    expect(id).toBe('upload-id');
  });

  it('dismissing without id clears all toasts', () => {
    dismissToast();

    expect(sonnerToast.dismiss).toHaveBeenCalledWith();
  });

  it('dismissing with id clears one toast', () => {
    dismissToast('upload-id');

    expect(sonnerToast.dismiss).toHaveBeenCalledWith('upload-id');
  });
});
