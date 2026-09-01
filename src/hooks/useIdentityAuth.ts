import { useState, useEffect } from "react";
import { getMasterKeySet, hasMasterIdentity } from "../lib/identity/masterKey";
import { logError } from "../lib/errorHandling";

export type IdentityStatus = "loading" | "new-user" | "existing-user";

export function useIdentityAuth() {
  const [status, setStatus] = useState<IdentityStatus>("loading");
  const isE2EMode =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).has("e2e") ||
      import.meta.env.VITE_USE_MOCK === "true");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const exists = await hasMasterIdentity();
        if (cancelled) return;
        if (exists) {
          setStatus("existing-user");
          return;
        }

        if (isE2EMode) {
          await getMasterKeySet();
          if (cancelled) return;
          setStatus("existing-user");
          return;
        }

        setStatus("new-user");
      } catch (e) {
        if (cancelled) return;
        logError(e, "identityCheck");
        setStatus("new-user");
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [isE2EMode]);

  return { status };
}
