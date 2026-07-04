type UpdateServiceWorker = () => Promise<void>;

type RegisterServiceWorkerOptions = {
  onOfflineReady: () => void;
  onUpdateAvailable: (updateServiceWorker: UpdateServiceWorker) => void;
};

const canRegisterServiceWorker = () =>
  import.meta.env.PROD && "serviceWorker" in navigator;

export const registerServiceWorker = ({
  onOfflineReady,
  onUpdateAvailable,
}: RegisterServiceWorkerOptions) => {
  if (!canRegisterServiceWorker()) {
    return () => undefined;
  }

  let isActive = true;
  let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null =
    null;

  void import("virtual:pwa-register").then(({ registerSW }) => {
    if (!isActive) {
      return;
    }

    updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        onUpdateAvailable(() => updateServiceWorker?.(true) ?? Promise.resolve());
      },
      onOfflineReady,
      onRegisterError() {
        updateServiceWorker = null;
      },
    });
  });

  return () => {
    isActive = false;
  };
};
