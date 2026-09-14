import { useEffect } from "react";
import { p2pNetwork } from "../lib/p2p/network";
import { initFileTransferDb } from "../lib/fileTransfer/fileStore";

let bootStarted = false;

/**
 * App-boot hook: opens the file-transfer IDB schema and initializes the P2P network once.
 * The module flag guards StrictMode double-mount — `p2pNetwork.init()` re-adds window
 * listeners on every call, so it must not run twice.
 */
export function useP2PBoot() {
  useEffect(() => {
    if (bootStarted) return;
    bootStarted = true;
    void initFileTransferDb().catch(() => {});
    void p2pNetwork.init().catch(() => {});
  }, []);
}
