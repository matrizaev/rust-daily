import { useCallback, useEffect, useState } from "react";
import { registerServiceWorker } from "../pwa/registerServiceWorker";

type UpdateServiceWorker = () => Promise<void>;

export const usePwaState = () => {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] =
    useState<UpdateServiceWorker | null>(null);

  useEffect(() => {
    const updateOnlineState = () => setIsOffline(!navigator.onLine);

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    return registerServiceWorker({
      onOfflineReady: () => undefined,
      onUpdateAvailable: (update) => setUpdateServiceWorker(() => update),
    });
  }, []);

  const handleReloadUpdate = useCallback(() => {
    if (!updateServiceWorker) {
      return;
    }

    setIsUpdating(true);
    void updateServiceWorker().catch(() => setIsUpdating(false));
  }, [updateServiceWorker]);

  return {
    isOffline,
    isUpdating,
    updateAvailable: updateServiceWorker !== null,
    handleReloadUpdate,
  };
};
