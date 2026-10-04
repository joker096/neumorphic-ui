import { useEffect, useState } from "react";
import {
  pruneAbandonedTransfers, pruneCompletedTransfers, enforceFileTransferBudget,
} from "../lib/fileTransfer/fileStore";
import { p2pNetwork } from "../lib/p2p/network";
import { createFileFrameHandler } from "../lib/p2p/inbound/inboundFileTransfer";
import { createInboundMessageHandler } from "../lib/p2p/inbound/inboundRouter";

/**
 * P2P receive: handles `ftr1:` file frames (meta/chunk/end) and `msg1:` chat text
 * frames broadcast by other peers. Incoming messages land in the name-matched
 * DM chat (skipped when no matching chat exists). Exposes per-transfer progress.
 *
 * The frame handlers live in `lib/p2p/inbound/` — authorization gate
 * (`inboundGate`), chat mutations (`inboundChatStore`), per-kind receivers
 * (file/album/chat/voice/rich frames) and the wire dispatcher (`inboundRouter`).
 * This hook only owns the progress state, the mount-time storage GC and the
 * transport subscription.
 */
export function useP2PMessages() {
  const [receiveProgress, setReceiveProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    // Storage GC at mount: abandoned incomplete transfers, stale completed transfers,
    // and byte-budget eviction (oldest first) keep the IDB file-transfer store bounded.
    void (async () => {
      await pruneAbandonedTransfers();
      await pruneCompletedTransfers();
      await enforceFileTransferBudget();
    })().catch(() => {});

    const handleFileFrame = createFileFrameHandler(setReceiveProgress);
    p2pNetwork.onMessage(createInboundMessageHandler(handleFileFrame));
  }, []);

  return { receiveProgress };
}