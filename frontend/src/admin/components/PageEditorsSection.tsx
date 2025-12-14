import { Badge } from "@fluffylabs/shared-ui";

interface PageEditorsSectionProps {
  editors: string[];
}

export function PageEditorsSection({ editors }: PageEditorsSectionProps) {
  return (
    <div className="mb-5">
      <h3 className="mb-3">Editors</h3>
      {editors.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {editors.map((editor) => (
            <Badge key={editor} title={editor}>
              {editor.slice(0, 6)}...{editor.slice(-4)}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No editors assigned yet.</p>
      )}
    </div>
  );
}
