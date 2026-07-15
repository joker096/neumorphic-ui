import '@testing-library/jest-dom/vitest';

// Suppress canvas-related warnings in test environment
if (typeof HTMLCanvasElement !== 'undefined') {
  (HTMLCanvasElement.prototype as any).getContext = function(this: HTMLCanvasElement, contextId: string, ...args: any[]): any {
    if (contextId !== '2d') {
      return (function originalGetContext(this: HTMLCanvasElement, id: string, ...rest: any[]) {
        return originalGetContext.call(this, id, ...rest);
      }).apply(this, [contextId, ...args]);
    }
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: () => {},
      createImageData: (w: number, h: number) => ({
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4),
      }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
      canvas: { width: 0, height: 0 },
      transferFromImageBitmap: () => {},
    };
  };
}
