export interface CmsLayout {
  mode: "cms";
  header?: string;
  content: string;
  footer?: string;
}

export interface WikiLayout {
  mode: "wiki";
  header?: string;
  content: string;
  footer?: string;
  sidenav?: string;
}

export type PageLayout = CmsLayout | WikiLayout;

export function isPageLayout(value: unknown): value is PageLayout {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.mode !== "cms" && obj.mode !== "wiki") return false;
  if (typeof obj.content !== "string") return false;
  return true;
}

export function tryParsePageLayout(content: string): PageLayout | null {
  try {
    const parsed = JSON.parse(content);
    if (isPageLayout(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
