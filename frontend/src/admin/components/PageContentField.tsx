import { RichEditor } from "./RichEditor";

interface PageContentFieldProps {
  walrusId: string;
  path: string;
  content: string;
  onChange: (value: string) => void;
}

export function PageContentField({
  walrusId,
  path,
  content,
  onChange,
}: PageContentFieldProps) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="content" className="font-medium">
          Content
        </label>
        <div className="flex gap-2">
          <span className="text-xs text-gray-500">Walrus ID:</span>
          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {walrusId}
          </code>
        </div>
      </div>
      <RichEditor
        content={content}
        onChange={onChange}
        format={path.endsWith(".md") ? "markdown" : "html"}
      />
    </div>
  );
}
