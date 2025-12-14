import { Button } from "@fluffylabs/shared-ui";

interface PageSaveActionsProps {
  onSave: () => void;
  onCancel: () => void;
  saveDisabled: boolean;
  walletConnected: boolean;
  canEdit: boolean;
  showSavingState: boolean;
}

export function PageSaveActions({
  onSave,
  onCancel,
  saveDisabled,
  walletConnected,
  canEdit,
  showSavingState,
}: PageSaveActionsProps) {
  return (
    <>
      <div className="flex gap-3">
        <Button onClick={onSave} disabled={saveDisabled}>
          {showSavingState ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {!walletConnected && (
        <p className="text-sm text-gray-500 mt-2">Connect your wallet to save changes</p>
      )}
      {walletConnected && !canEdit && (
        <p className="text-sm text-gray-500 mt-2">You don't have permission to edit this page</p>
      )}
    </>
  );
}
