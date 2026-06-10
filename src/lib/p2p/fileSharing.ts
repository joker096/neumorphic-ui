// P2P File Sharing - Simplified file sharing over P2P network

import { p2pNetwork } from './network';

export interface FileTransfer {
  fileId: string;
  fileName: string;
  fileSize: number;
  peerId: string;
  status: 'pending' | 'sending' | 'receiving' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
}

export const fileSharing = {
  transfers: new Map<string, FileTransfer>(),

  async sendFile(file: File, peerId: string): Promise<{ fileId: string; status: string }> {
    const fileId = crypto.randomUUID();

    // Create transfer record
    const transfer: FileTransfer = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      peerId,
      status: 'sending',
      progress: 0,
      startTime: Date.now(),
    };

    this.transfers.set(fileId, transfer);

    // Simulate sending
    setTimeout(() => {
      transfer.status = 'completed';
      transfer.endTime = Date.now();
      transfer.progress = 100;
    }, 1000);

    // Notify P2P network
    p2pNetwork.broadcast({
      type: 'file-transfer',
      fileId,
      peerId,
      fileName: file.name,
      fileSize: file.size,
    });

    return { fileId, status: 'sent' };
  },

  receiveFile(fileId: string): Promise<{ file: File; status: string }> {
    return new Promise((resolve) => {
      const transfer = this.transfers.get(fileId);
      if (!transfer) {
        resolve({ file: new File([], 'unknown'), status: 'not-found' });
        return;
      }

      // Simulate receiving
      resolve({
        file: new File([], transfer.fileName),
        status: 'received',
      });
    });
  },

  getTransfers(peerId?: string): FileTransfer[] {
    if (peerId) {
      return Array.from(this.transfers.values() as Iterable<FileTransfer>).filter((t) => t.peerId === peerId);
    }
    return Array.from(this.transfers.values()) as FileTransfer[];
  },

  cancelTransfer(fileId: string): void {
    this.transfers.delete(fileId);
  },
};
