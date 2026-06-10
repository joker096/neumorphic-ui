// Yield to Main - Yield execution to main thread

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    requestIdleCallback(() => {
      resolve();
    });
  });
}

export function processInChunks<T>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<void>
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return chunks.reduce((promise, chunk) => {
    return promise.then(() => processor(chunk));
  }, Promise.resolve());
}
