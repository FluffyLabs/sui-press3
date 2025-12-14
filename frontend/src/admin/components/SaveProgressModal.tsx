import { DialogModal } from "@fluffylabs/shared-ui";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import type { SaveStep } from "../services/save";

interface SaveProgressModalProps {
  open: boolean;
  currentStep: SaveStep | null;
  isSuccess: boolean;
  error: string | null;
  transactionDigests: {
    register?: string;
    certify?: string;
    update?: string;
  } | null;
  onClose: () => void;
}

const STEPS = [
  { id: "registering" as SaveStep, label: "Acquiring Storage Space" },
  { id: "certifying" as SaveStep, label: "Certifying Blob Receipts" },
  { id: "updating" as SaveStep, label: "Updating CMS Contract" },
];

export function SaveProgressModal({
  open,
  currentStep,
  isSuccess,
  error,
  transactionDigests,
  onClose,
}: SaveProgressModalProps) {
  const getStepStatus = (stepId: SaveStep) => {
    if (isSuccess) return "completed";
    if (!currentStep) return "pending";

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  // Only allow closing when transaction is complete (success or error)
  const canClose = isSuccess || error !== null;

  const handleOpenChange = (open: boolean) => {
    // Only allow closing if transaction is complete
    if (!open && canClose) {
      onClose();
    }
  };

  return (
    <DialogModal open={open} onOpenChange={handleOpenChange}>
      <DialogModal.Content className="max-w-md">
        <DialogModal.Title>
          {isSuccess ? "Save Complete" : error ? "Save Failed" : "Saving Page"}
        </DialogModal.Title>

        <DialogModal.Body>
          {/* Progress Steps */}
          <div className="space-y-4 mb-6">
            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {status === "active" && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  )}
                  {status === "pending" && (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span
                    className={
                      status === "completed"
                        ? "text-gray-900 font-medium"
                        : status === "active"
                          ? "text-blue-600 font-medium"
                          : "text-gray-500"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Success Summary with Transaction Links */}
          {isSuccess && transactionDigests && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <div className="font-semibold text-green-900 mb-3">
                Page saved successfully!
              </div>
              <div className="text-sm space-y-2">
                <div className="font-medium text-green-900">
                  Transaction Links:
                </div>
                {transactionDigests.register && (
                  <div className="text-green-800">
                    1. Walrus Register:{" "}
                    <a
                      href={`https://testnet.suivision.xyz/txblock/${transactionDigests.register}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on SuiVision
                    </a>
                  </div>
                )}
                {transactionDigests.certify && (
                  <div className="text-green-800">
                    2. Walrus Certify:{" "}
                    <a
                      href={`https://testnet.suivision.xyz/txblock/${transactionDigests.certify}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on SuiVision
                    </a>
                  </div>
                )}
                {transactionDigests.update && (
                  <div className="text-green-800">
                    3. Contract Update:{" "}
                    <a
                      href={`https://testnet.suivision.xyz/txblock/${transactionDigests.update}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on SuiVision
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogModal.Body>

        {(isSuccess || error) && (
          <DialogModal.Footer>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </DialogModal.Footer>
        )}
      </DialogModal.Content>
    </DialogModal>
  );
}
