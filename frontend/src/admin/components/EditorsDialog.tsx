import { useEffect, useMemo, useState } from "react";
import { Button, DialogModal, Input } from "@fluffylabs/shared-ui";

interface EditorsDialogProps {
  open: boolean;
  pagePath?: string;
  editors: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (editors: string[]) => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}

export function EditorsDialog({
  open,
  pagePath,
  editors,
  onOpenChange,
  onSave,
  isSaving = false,
  errorMessage,
}: EditorsDialogProps) {
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSlots(editors.length ? editors : [""]);
    } else {
      setSlots([]);
    }
  }, [open, editors]);

  const trimmedSlots = useMemo(() => slots.map((slot) => slot.trim()), [slots]);
  const hasEmptySlot = trimmedSlots.some((slot) => slot === "");
  const hasChanges = useMemo(() => {
    if (trimmedSlots.length !== editors.length) return true;
    return trimmedSlots.some((slot, index) => slot !== editors[index]);
  }, [trimmedSlots, editors]);

  const handleSlotChange = (index: number, value: string) => {
    setSlots((prev) =>
      prev.map((slot, slotIndex) => (slotIndex === index ? value : slot)),
    );
  };

  const handleSlotRemove = (index: number) => {
    setSlots((prev) => prev.filter((_, slotIndex) => slotIndex !== index));
  };

  const handleAddSlot = () => {
    setSlots((prev) => [...prev, ""]);
  };

  const handleSave = () => {
    if (hasEmptySlot || isSaving) return;
    onSave(trimmedSlots);
  };

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <DialogModal.Content className="max-w-lg">
        <DialogModal.Title>Edit Editors</DialogModal.Title>
        <DialogModal.Body>
          {pagePath && (
            <p className="text-sm text-gray-500 mb-3">Page: {pagePath}</p>
          )}
          <div className="space-y-4">
            {slots.length === 0 && (
              <p className="text-sm text-gray-500">
                No editor slots yet. Add one below to assign an editor.
              </p>
            )}
            {slots.map((slot, index) => (
              <div key={`editor-slot-${index}`} className="flex items-center gap-3">
                <Input
                  value={slot}
                  onChange={(event) => handleSlotChange(index, event.target.value)}
                  placeholder="0x1234..."
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleSlotRemove(index)}
                  className="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddSlot}
                disabled={isSaving}
              >
                Add editor slot
              </Button>
            </div>
            {hasEmptySlot && (
              <p className="text-sm text-red-600">
                Please fill or remove empty slots before saving.
              </p>
            )}
            {!hasEmptySlot && !hasChanges && (
              <p className="text-sm text-gray-500">No changes to save.</p>
            )}
          </div>
        </DialogModal.Body>
        <DialogModal.Footer className="flex flex-col gap-2">
          {errorMessage && (
            <div className="text-sm text-red-600">{errorMessage}</div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={hasEmptySlot || !hasChanges || isSaving}
            >
              {isSaving ? "Saving..." : "Save Editors"}
            </Button>
          </div>
        </DialogModal.Footer>
      </DialogModal.Content>
    </DialogModal>
  );
}
