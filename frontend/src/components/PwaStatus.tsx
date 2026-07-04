import { RefreshCw, WifiOff } from "lucide-react";

type PwaStatusProps = {
  isOffline: boolean;
  isUpdating: boolean;
  updateAvailable: boolean;
  onReloadUpdate: () => void;
};

const OfflineStatus = ({ isOffline }: Pick<PwaStatusProps, "isOffline">) => {
  if (!isOffline) {
    return null;
  }

  return (
    <span className="pwa-status-item">
      <WifiOff size={17} aria-hidden="true" />
      Offline mode
    </span>
  );
};

type UpdateStatusProps = Pick<
  PwaStatusProps,
  "isUpdating" | "onReloadUpdate" | "updateAvailable"
>;

const UpdateStatus = ({
  isUpdating,
  onReloadUpdate,
  updateAvailable,
}: UpdateStatusProps) => {
  if (!updateAvailable) {
    return null;
  }

  return (
    <span className="pwa-status-item">
      <RefreshCw size={17} aria-hidden="true" />
      Update available
      <button
        className="pwa-update-button"
        type="button"
        onClick={onReloadUpdate}
        disabled={isUpdating}
      >
        Reload
      </button>
    </span>
  );
};

function PwaStatus({
  isOffline,
  isUpdating,
  updateAvailable,
  onReloadUpdate,
}: PwaStatusProps) {
  if (!isOffline && !updateAvailable) {
    return null;
  }

  return (
    <aside className="pwa-status" aria-live="polite">
      <OfflineStatus isOffline={isOffline} />
      <UpdateStatus
        isUpdating={isUpdating}
        updateAvailable={updateAvailable}
        onReloadUpdate={onReloadUpdate}
      />
    </aside>
  );
}

export default PwaStatus;
