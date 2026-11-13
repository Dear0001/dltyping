"use client";

import { useEffect } from "react";
import { subscribeStorage } from "@/lib/local-progress";
import { refreshAccount } from "@/lib/account";
import { ensureWelcomeStart } from "@/lib/progress/progress-analytics";
import { syncProgress } from "@/lib/sync";

/** Background sync: on load, after local progress changes (debounced), and when the connection returns. Renders nothing. */
export default function ProgressSync() {
  useEffect(() => {
    ensureWelcomeStart();
    let timer: number | undefined;
    const schedule = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void syncProgress(), delay);
    };
    void refreshAccount().then(() => schedule(300));
    const unsubscribe = subscribeStorage(() => schedule(4000));
    const online = () => schedule(500);
    window.addEventListener("online", online);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("online", online);
    };
  }, []);
  return null;
}
