// Reserves - Check and manage storage reserves

export interface ReserveMetrics {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  usagePercentage: number;
}

export function checkReserves(): { status: string; metrics: ReserveMetrics } {
  let usedSize = 0;

  // Estimate size of localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (key && value) {
      usedSize += key.length + value.length;
    }
  }

  const totalSize = 5 * 1024 * 1024; // 5MB for localStorage
  const availableSize = totalSize - usedSize;

  return {
    status: availableSize > 0 ? 'ok' : 'full',
    metrics: {
      totalSize,
      usedSize,
      availableSize,
      usagePercentage: (usedSize / totalSize) * 100,
    },
  };
}

export function clearStorage(): void {
  localStorage.clear();
  sessionStorage.clear();
}
