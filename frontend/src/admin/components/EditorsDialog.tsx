import { useEffect, useMemo, useState } from "react";
import { Button, DialogModal, Input } from "@fluffylabs/shared-ui";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface EditorsDialogProps {
  open: boolean;
  pagePath?: string;
  editors: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (editors: string[]) => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}

function isValidAddress(address: string): boolean {
  if (!address) return false;
  if (!address.startsWith("0x")) return false;
  if (address.length < 10) return false;
  // Check if the rest is valid hex
  const hexPart = address.slice(2);
  return /^[0-9a-fA-F]+$/.test(hexPart);
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
  const validationErrors = useMemo(() => {
    return trimmedSlots.map((slot) => {
      if (slot === "") return "Address is required";
      if (!isValidAddress(slot)) return "Invalid address format (must start with 0x)";
      return null;
    });
  }, [trimmedSlots]);

  const hasErrors = validationErrors.some((error) => error !== null);
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
    if (hasErrors || isSaving) return;
    onSave(trimmedSlots);
  };

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <DialogModal.Content className="max-w-2xl">
        <DialogModal.Title>Manage Page Editors</DialogModal.Title>
        <DialogModal.Body className="min-h-[40vh]">
          {pagePath && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
              <div className="text-xs text-gray-500 font-medium mb-1">PAGE PATH</div>
              <div className="text-sm font-mono text-gray-900">{pagePath}</div>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Editor Addresses
              </label>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddSlot}
                disabled={isSaving}
                className="text-sm h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Editor
              </Button>
            </div>

            {slots.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm mb-2">No editors assigned yet</p>
                <p className="text-xs text-gray-400">Click "Add Editor" to get started</p>
              </div>
            )}

            {slots.map((slot, index) => (
              <div key={`editor-slot-${index}`} className="space-y-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      value={slot}
                      onChange={(event) => handleSlotChange(index, event.target.value)}
                      placeholder="0x1234567890abcdef..."
                      className={`font-mono text-sm ${validationErrors[index] && slot ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSlotRemove(index)}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center w-9 h-9 rounded border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    title="Remove editor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {validationErrors[index] && slot && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1 ml-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors[index]}</span>
                  </div>
                )}
              </div>
            ))}

            {!hasErrors && !hasChanges && slots.length > 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                No changes to save
              </div>
            )}
          </div>
        </DialogModal.Body>
        <DialogModal.Footer className="flex flex-col gap-2">
          {errorMessage && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
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
              disabled={hasErrors || !hasChanges || isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogModal.Footer>
      </DialogModal.Content>
    </DialogModal>
  );
}
