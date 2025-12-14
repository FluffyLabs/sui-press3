import { Badge, Button } from "@fluffylabs/shared-ui";
import { Pencil, Users } from "lucide-react";

interface PageEditorsSectionProps {
  editors: string[];
  onEditClick?: () => void;
  canEdit?: boolean;
}

export function PageEditorsSection({
  editors,
  onEditClick,
  canEdit = false,
}: PageEditorsSectionProps) {
  return (
    <div className="mb-5 border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900 m-0">Editors</h3>
        </div>
        {canEdit && onEditClick && (
          <Button
            type="button"
            variant="secondary"
            onClick={onEditClick}
            className="text-sm h-8"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit Editors
          </Button>
        )}
      </div>
      {editors.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {editors.map((editor) => (
            <Badge key={editor} title={editor} className="font-mono">
              {editor.slice(0, 8)}...{editor.slice(-6)}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 py-2">
          No editors assigned yet.{" "}
          {canEdit && onEditClick && "Click 'Edit Editors' to add some."}
        </div>
      )}
    </div>
  );
}
