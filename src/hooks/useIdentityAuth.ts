import { useState, useEffect } from "react";
import * as idb from "idb-keyval";
import { hasMasterIdentity } from "../lib/identity/masterKey";

export type IdentityStatus = "loading" | "new-user" | "existing-user";

export function useIdentityAuth() {
  const [status, setStatus] = useState<IdentityStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const exists = await hasMasterIdentity();
        if (cancelled) return;
        setStatus(exists ? "existing-user" : "new-user");
      } catch {
        if (cancelled) return;
        setStatus("new-user");
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  return { status };
}
