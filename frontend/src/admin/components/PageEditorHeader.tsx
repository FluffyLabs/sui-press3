import { ArrowLeft } from "lucide-react";

interface PageEditorHeaderProps {
  onBack: () => void;
}

export function PageEditorHeader({ onBack }: PageEditorHeaderProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-5 cursor-pointer"
    >
      <ArrowLeft size={20} />
      <span>Back</span>
    </button>
  );
}
