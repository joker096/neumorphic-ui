export function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  chunkSize: number = 50
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      results.push(processor(chunk[j], i + j));
    }
    if (i + chunkSize < items.length) {
      await yieldToMain();
    }
  }
  return results;
}

export async function processInBatches<T, R>(
  items: T[],
  batchProcessor: (batch: T[], startIndex: number) => Promise<R[]>,
  batchSize: number = 50
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await batchProcessor(batch, i);
    results.push(...batchResults);
  }
  return results;
}
