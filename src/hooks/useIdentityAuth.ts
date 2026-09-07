import { useState, useCallback, useEffect } from "react";
import { getMasterKeySet, hasMasterIdentity } from "../lib/identity/masterKey";
import { logError } from "../lib/errorHandling";

export type IdentityStatus = "loading" | "new-user" | "existing-user";

export function useIdentityAuth() {
  const [status, setStatus] = useState<IdentityStatus>("loading");
  const isE2EMode =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).has("e2e") ||
      import.meta.env.VITE_USE_MOCK === "true");

  const recheck = useCallback(async () => {
    try {
      const exists = await hasMasterIdentity();
      if (exists) {
        setStatus("existing-user");
        return;
      }

      if (isE2EMode) {
        await getMasterKeySet();
        setStatus("existing-user");
        return;
      }

      setStatus("new-user");
    } catch (e) {
      logError(e, "identityCheck");
      setStatus("new-user");
    }
  }, [isE2EMode]);

  useEffect(() => {
    recheck();
  }, [recheck]);

  return { status, recheck };
}
