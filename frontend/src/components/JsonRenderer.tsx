import { useMemo } from "react";

interface Props {
  content: string;
}

export const JsonRenderer = ({ content }: Props) => {
  const formattedContent = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return null;
    }
  }, [content]);

  return <pre>{formattedContent === null ? content : formattedContent}</pre>;
};
