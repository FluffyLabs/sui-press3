import { Input } from "@fluffylabs/shared-ui";

interface PagePathFieldProps {
  path: string;
}

export function PagePathField({ path }: PagePathFieldProps) {
  return (
    <div className="mb-5">
      <label htmlFor="path" className="block mb-2 font-medium">
        Page Path
      </label>
      <Input id="path" value={path} disabled placeholder="/path/to/page.html" />
    </div>
  );
}
