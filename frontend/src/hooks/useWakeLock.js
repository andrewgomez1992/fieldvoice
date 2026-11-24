import { useEffect } from "react";

/**
 * Keep the screen on while `active` is true. Phones cut the microphone when
 * the screen locks, so this keeps a hands-free report listening.
 * Re-acquires the lock when the tab becomes visible again.
 */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock.release();
      } catch (err) {
        console.warn("Wake lock unavailable:", err);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
